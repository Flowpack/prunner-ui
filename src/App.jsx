import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import format from "date-fns/format";

const authHeader = (token) => {
  if (!token) {
    return null;
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

const getPipelinesJobs =
  ({ apiBaseUrl, authToken, extraApiHeaders }) =>
  async () => {
    const response = await fetch(`${apiBaseUrl}pipelines/jobs`, {
      headers: {
        ...authHeader(authToken),
        ...extraApiHeaders,
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json();
  };

const postPipelinesSchedule =
  ({ apiBaseUrl, authToken, extraApiHeaders }) =>
  (pipeline) =>
    fetch(`${apiBaseUrl}pipelines/schedule`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeader(authToken),
        ...extraApiHeaders,
      },
      method: "POST",
      body: JSON.stringify({
        pipeline,
      }),
    });

const getJobLogs =
  ({ apiBaseUrl, authToken, extraApiHeaders }, id, task) =>
  async () => {
    const response = await fetch(`${apiBaseUrl}job/logs?id=${encodeURIComponent(id)}&task=${encodeURIComponent(task)}`, {
      headers: {
        ...authHeader(authToken),
        ...extraApiHeaders,
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json();
  };

const App = ({
  // Base URL / path for API requests to prunner
  apiBaseUrl = "/",
  // Polling interval in ms
  refreshInterval = 5000,
  // Explicitly set an auth token (e.g. inject via HTML to prop for dev)
  authToken,
  // Set additional headers to send for API requests (e.g. CSRF token)
  extraApiHeaders = {},
}) => {
  const apiOpts = { apiBaseUrl, authToken, extraApiHeaders };

  const [currentSelection, setCurrentSelection] = useState({
    job: null,
    task: null,
  });

  const pipelinesJobsResult = useQuery(
    "pipelines/jobs",
    getPipelinesJobs(apiOpts),
    {
      refetchInterval: refreshInterval,
    }
  );

  const queryClient = useQueryClient();
  const startMutation = useMutation(postPipelinesSchedule(apiOpts), {
    onSuccess: () => {
      queryClient.invalidateQueries("pipelines/jobs");
    },
  });

  return (
    <div className="grid grid-cols-12 h-full">
      <div className="col-span-3 bg-gray-700 p-4">
        <h2 className="text-2xl text-green-300 mb-4">Pipelines</h2>
        <PipelineList
          startMutation={startMutation}
          pipelinesJobsResult={pipelinesJobsResult}
        />
      </div>
      <div className="col-span-3 bg-gray-600 p-4 overflow-hidden overflow-y-scroll">
        <h2 className="text-2xl text-green-400 mb-4">Jobs</h2>
        <JobsList
          pipelinesJobsResult={pipelinesJobsResult}
          setCurrentSelection={setCurrentSelection}
        />
      </div>
      <div className="col-span-6 bg-gray-700 p-4">
        {currentSelection.task ? (
          <TaskDetail
            pipelinesJobsResult={pipelinesJobsResult}
            currentSelection={currentSelection}
            apiOpts={apiOpts}
            refreshInterval={refreshInterval}
          />
        ) : null}
      </div>
    </div>
  );
};

const PipelineList = ({ startMutation, pipelinesJobsResult }) => {
  const { isLoading, isError, data, error } = pipelinesJobsResult;

  if (isLoading) {
    return <span>Loading...</span>;
  }

  if (isError) {
    return <span>Error: {error.message}</span>;
  }

  return (
    <div className="">
      {data.pipelines?.map((pipeline) => {
        const startDisabled =
          startMutation.isLoading || !pipeline.schedulable;

        return (
          <div
            key={pipeline.pipeline}
            className="p-4 mb-4 border-gray-400 border-2 rounded-md"
          >
            <div className="font-extralight text-lg text-white mb-4">
              {pipeline.pipeline}
            </div>
            <button
              className={`${
                startDisabled ? "bg-gray-500" : "bg-green-600"
              } text-white py-2 px-3`}
              disabled={startDisabled}
              onClick={() => {
                startMutation.mutate(pipeline.pipeline);
              }}
            >
              ▶︎ Start
            </button>
          </div>
        );
      })}
    </div>
  );
};

const JobsList = ({ pipelinesJobsResult, setCurrentSelection }) => {
  const { isLoading, isError, data, error } = pipelinesJobsResult;

  if (isLoading) {
    return <span>Loading...</span>;
  }

  if (isError) {
    return <span>Error: {error.message}</span>;
  }

  return (
    <div className="">
      {data.jobs?.map((job) => (
        <div
          key={job.id}
          className={`p-4 mb-4 border-2 rounded-md ${
            job.errored
              ? "border-red-500"
              : job.completed
              ? "border-green-600"
              : job.canceled ?"border-gray-400" :"border-yellow-500"
          }`}
        >
          <div className="font-extralight text-lg text-white mb-2">
            {job.pipeline}
          </div>
          <div className="mb-2 grid grid-cols-2 gap-4">
            {job.start ? (
            <div>
              <span className="text-sm mr-2 text-indigo-400">Start</span>
              <span className="text-sm text-white mr-4">
                {format(new Date(job.start), "HH:mm:ss")}
              </span>
            </div>
            ) : (
              <div>
                <span className="text-sm mr-2 text-indigo-400">Queued</span>
                <span className="text-sm text-white mr-4">
                  {format(new Date(job.created), "HH:mm:ss")}
                </span>
              </div>
              )}
            {job.completed ? (
              <div>
                <span className="text-sm mr-2 text-indigo-400">End</span>
                <span className="text-sm text-white">
                  {format(new Date(job.end), "HH:mm:ss")}
                </span>
              </div>
            ) : job.canceled ? (
              <div>
                <span className="text-sm mr-2 text-indigo-400">Canceled</span>
                </div>
            ) : null}
          </div>
          <div>
            {job.tasks.map((task) => (
              <button
                key={task.name}
                onClick={() =>
                  setCurrentSelection({ job: job.id, task: task.name })
                }
                title={task.name}
                className={`inline-block w-5 h-5 mr-3 rounded-md ${taskBg(
                  task.status
                )}`}
              ></button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const TaskDetail = ({ pipelinesJobsResult, currentSelection, apiOpts, refreshInterval }) => {
  if (pipelinesJobsResult.isLoading || pipelinesJobsResult.isError) {
    return null;
  }

  let task = null, job = null;
  if (currentSelection.job && currentSelection.task) {
    job = pipelinesJobsResult.data.jobs?.find(
      (job) => job.id === currentSelection.job
    );
    if (job) {
      task = job.tasks.find((task) => task.name === currentSelection.task);
    }
  }
  if (!task) {
    return null;
  }

  return (
    <div>
      <div className="text-2xl text-gray-300 mb-4">
        <span className="text-green-500">Task</span> {task.name}
        <span
          className={`text-xs p-1 ml-2 font-semibold uppercase align-middle rounded-lg ${taskBg(
            task.status
          )}`}
        >
          {task.status}
        </span>
      </div>

      {task.errored && (
        <div className="mb-4 bg-red-500 p-4">
          <div className="text-white">
            Task failed with exit code{" "}
            <span className="font-mono font-bold">{task.exitCode}</span>
          </div>
        </div>
      )}

      {job.variables &&
        <div className="mb-4">
          <div className="text-base text-indigo-500 mb-2">Variables</div>
          <div className="bg-gray-800 text-gray-400 font-mono whitespace-pre-line p-2">
            {JSON.stringify(job.variables, null, 4)}
          </div>
        </div>
      }

      <TaskLogs job={job} task={task} apiOpts={apiOpts} refreshInterval={refreshInterval} />
    </div>
  );
};

const TaskLogs = ({job, task, apiOpts, refreshInterval}) => {

  const jobLogsResult = useQuery(
    ["job/logs", job.id, task.name],
    getJobLogs(apiOpts, job.id, task.name),
    {
      refetchInterval: refreshInterval,
    }
  );

  return (<>
    <div className="mb-4">
      <div className="text-base text-indigo-500 mb-2">STDOUT</div>
      <div className="bg-gray-800 text-gray-400 font-mono whitespace-pre-line p-2">
        {jobLogsResult.isLoading ? "..." : jobLogsResult.data.stdout}
      </div>
    </div>
    <div className="mb-4">
      <div className="text-base text-indigo-500 mb-2">STDERR</div>
      <div className="bg-gray-800 text-gray-400 font-mono whitespace-pre-line p-2">
      {jobLogsResult.isLoading ? "..." : jobLogsResult.data.stderr}
      </div>
    </div>
  </>)
}

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

function taskBg(status) {
  switch (status) {
    case "running":
      return "bg-yellow-500";
    case "done":
      return "bg-green-600";
    case "error":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

export default App;
