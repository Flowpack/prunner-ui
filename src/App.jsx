import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import format from "date-fns/format";
import { IconButton, TextButton } from "./components/Buttons";

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
      const response = await fetch(
        `${apiBaseUrl}job/logs?id=${encodeURIComponent(
          id
        )}&task=${encodeURIComponent(task)}`,
        {
          headers: {
            ...authHeader(authToken),
            ...extraApiHeaders,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    };

const postJobCancel =
  ({ apiBaseUrl, authToken, extraApiHeaders }) =>
    (jobId) =>
      fetch(`${apiBaseUrl}job/cancel?id=${encodeURIComponent(jobId)}`, {
        headers: {
          ...authHeader(authToken),
          ...extraApiHeaders,
        },
        method: "POST",
      });

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

  return (
    <div className="grid grid-cols-12 h-full">
      <div className="col-span-3 bg-gray-700 p-4">
        <h2 className="text-2xl text-white mb-4">Pipelines</h2>
        <PipelineList
          pipelinesJobsResult={pipelinesJobsResult}
          apiOpts={apiOpts}
        />
      </div>
      <div className="col-span-3 bg-gray-600 p-4 overflow-hidden overflow-y-scroll">
        <h2 className="text-2xl text-white mb-4">Jobs</h2>
        <JobsList
          pipelinesJobsResult={pipelinesJobsResult}
          setCurrentSelection={setCurrentSelection}
          apiOpts={apiOpts}
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

const PipelineList = ({ pipelinesJobsResult, apiOpts }) => {
  const { isLoading, isError, data, error } = pipelinesJobsResult;

  if (isLoading) {
    return <span>Loading...</span>;
  }

  if (isError) {
    return <span>Error: {error.message}</span>;
  }

  return (
    <div className="">
      {data.pipelines?.map((pipeline) => (
        <PipelineListItem
          key={pipeline.pipeline}
          pipeline={pipeline}
          apiOpts={apiOpts}
        />
      ))}
    </div>
  );
};

const PipelineListItem = ({ pipeline, apiOpts }) => {
  const queryClient = useQueryClient();
  const startMutation = useMutation(postPipelinesSchedule(apiOpts), {
    onSuccess: () => {
      queryClient.invalidateQueries("pipelines/jobs");
    },
  });

  const startDisabled = startMutation.isLoading || !pipeline.schedulable;

  return (
    <div
      className="p-4 mb-4 border-gray-500 border"
    >
      <div className="font-extralight text-lg text-white mb-4">
        {pipeline.pipeline}
      </div>
      <TextButton
        disabled={startDisabled}
        onClick={() => {
          startMutation.mutate(pipeline.pipeline);
        }}
        loading={startMutation.isLoading}
      >
        <span className="text-white text-sm">▶︎ Start</span>
      </TextButton>
    </div>
  );
};

const JobsList = ({ pipelinesJobsResult, setCurrentSelection, apiOpts }) => {
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
        <JobsListItem
          key={job.id}
          job={job}
          setCurrentSelection={setCurrentSelection}
          apiOpts={apiOpts}
        />
      ))}
    </div>
  );
};

const JobsListItem = ({ job, setCurrentSelection, apiOpts }) => {
  const jobCancelMutation = useMutation(postJobCancel(apiOpts), {
    onSuccess: () => {
      queryClient.invalidateQueries("pipelines/jobs");
    },
  });

  return (
    <div
      className={`p-4 mb-4 border ${job.canceled
          ? "border-gray-400"
          : job.errored
            ? "border-red"
            : job.completed
              ? "border-green"
              : "border-orange"
        }`}
    >
      <div className="font-extralight text-lg text-white mb-2">
        {job.pipeline}
        {job.start && !job.end && !job.canceled && (
          <div className="float-right">
            <IconButton
              danger
              title="Cancel"
              disabled={jobCancelMutation.isLoading}
              onClick={() => {
                jobCancelMutation.mutate(job.id);
              }}
              loading={jobCancelMutation.isLoading}
            >
              <span className="p-1">◼︎&nbsp;cancel</span>
            </IconButton>
          </div>
        )}
      </div>
      <div className="mb-2 grid grid-cols-2 gap-4">
        {job.start ? (
          <div>
            <span className="text-sm mr-2 text-blue">Start</span>
            <span className="text-sm text-white mr-4">
              {format(new Date(job.start), "HH:mm:ss")}
            </span>
          </div>
        ) : (
          <div>
            <span className="text-sm mr-2 text-blue">Queued</span>
            <span className="text-sm text-white mr-4">
              {format(new Date(job.created), "HH:mm:ss")}
            </span>
          </div>
        )}
        {job.canceled ? (
          <div>
            <span className="text-sm mr-2 text-blue">Canceled</span>
          </div>
        ) : job.completed ? (
          <div>
            <span className="text-sm mr-2 text-blue">End</span>
            <span className="text-sm text-white">
              {format(new Date(job.end), "HH:mm:ss")}
            </span>
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
  );
};

const TaskDetail = ({
  pipelinesJobsResult,
  currentSelection,
  apiOpts,
  refreshInterval,
}) => {
  if (pipelinesJobsResult.isLoading || pipelinesJobsResult.isError) {
    return null;
  }

  let task = null,
    job = null;
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
        <span className="text-white">Task</span> {task.name}
        <span
          className={`text-xs p-1 ml-2 font-semibold uppercase align-middle rounded ${taskBg(
            task.status
          )}`}
        >
          {task.status}
        </span>
      </div>

      {task.errored && (
        <div className="mb-4 bg-red p-4">
          <div className="text-white">
            Task failed with exit code{" "}
            <span className="font-mono font-bold">{task.exitCode}</span>
          </div>
        </div>
      )}

      {job.variables && (
        <div className="mb-4">
          <div className="text-base text-blue mb-2">Variables</div>
          <div className="bg-gray-600 text-gray-400 font-mono whitespace-pre-line p-2">
            {JSON.stringify(job.variables, null, 4)}
          </div>
        </div>
      )}

      <TaskLogs
        job={job}
        task={task}
        apiOpts={apiOpts}
        refreshInterval={refreshInterval}
      />
    </div>
  );
};

const TaskLogs = ({ job, task, apiOpts, refreshInterval }) => {
  const jobLogsResult = useQuery(
    ["job/logs", job.id, task.name],
    getJobLogs(apiOpts, job.id, task.name),
    {
      refetchInterval: refreshInterval,
    }
  );

  return (
    <>
      <div className="mb-4">
        <div className="text-base text-blue mb-2">STDOUT</div>
        <div className="bg-gray-600 text-gray-400 font-mono whitespace-pre-line p-2">
          {jobLogsResult.isLoading
            ? "..."
            : jobLogsResult.isError
              ? `Logs could not be loaded: ${jobLogsResult.error}`
              : jobLogsResult.data.stdout}
        </div>
      </div>
      <div className="mb-4">
        <div className="text-base text-blue mb-2">STDERR</div>
        <div className="bg-gray-600 text-gray-400 font-mono whitespace-pre-line p-2">
          {jobLogsResult.isLoading
            ? "..."
            : jobLogsResult.isError
              ? `Logs could not be loaded: ${jobLogsResult.error}`
              : jobLogsResult.data.stderr}
        </div>
      </div>
    </>
  );
};

function taskBg(status) {
  switch (status) {
    case "running":
      return "bg-orange";
    case "done":
      return "bg-green";
    case "error":
      return "bg-red";
    default:
      return "bg-gray-400";
  }
}

export default App;
