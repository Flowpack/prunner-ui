import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import format from "date-fns/format";
import { IconButton, TextButton } from "./components/Buttons";
import Spinner from "./components/Spinner";
import classNames from "classnames";

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
  // Remove some padding for embedding the UI in an IFrame
  removePadding = false,
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
    <div className="grid grid-cols-12 h-full bg-gray-700">
      <div
        className={classNames("col-span-2", {
          "p-4": !removePadding,
          "pt-4 pr-4 pb-4": removePadding,
        })}
      >
        <h2 className="text-2xl text-white mb-4">Pipelines</h2>
        <PipelineList
          pipelinesJobsResult={pipelinesJobsResult}
          apiOpts={apiOpts}
        />
      </div>
      <div className="col-span-4 p-4 border-l border-gray-500 overflow-hidden overflow-y-scroll">
        <h2 className="text-2xl text-white mb-4">Jobs</h2>
        <JobsList
          pipelinesJobsResult={pipelinesJobsResult}
          currentSelection={currentSelection}
          setCurrentSelection={setCurrentSelection}
          apiOpts={apiOpts}
        />
      </div>
      <div
        className={classNames("col-span-6 border-l border-gray-500", {
          "p-4": !removePadding,
          "pt-4 pl-4 pb-4": removePadding,
        })}
      >
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
    <div className="p-4 mb-4 border-gray-500 border">
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

const JobsList = ({
  pipelinesJobsResult,
  currentSelection,
  setCurrentSelection,
  apiOpts,
}) => {
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
          currentSelection={currentSelection}
          setCurrentSelection={setCurrentSelection}
          apiOpts={apiOpts}
        />
      ))}
    </div>
  );
};

const JobsListItem = ({
  job,
  currentSelection,
  setCurrentSelection,
  apiOpts,
}) => {
  const jobCancelMutation = useMutation(postJobCancel(apiOpts), {
    onSuccess: () => {
      queryClient.invalidateQueries("pipelines/jobs");
    },
  });

  return (
    <div
      className={`p-4 mb-4 border ${
        job.canceled
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
            className={classNames(
              "inline-block w-5 h-5 mr-3 rounded-md",
              taskClasses(task.status),
              {
                "outline-white":
                  job.id === currentSelection.job &&
                  task.name === currentSelection.task,
              }
            )}
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
      <div className="flex justify-between items-center text-2xl text-gray-300 mb-4">
        <span>
          <span className="text-white">Task</span>{" "}
          <span className="text-blue">{task.name}</span>
        </span>
        <span
          className={classNames(
            "text-xs p-1 ml-2 font-semibold uppercase align-middle rounded",
            taskClasses(task.status)
          )}
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

  if (jobLogsResult.isLoading) {
    return (
      <div>
        <Spinner />
      </div>
    );
  }

  if (jobLogsResult.isError) {
    return <div>{`Logs could not be loaded: ${jobLogsResult.error}`}</div>;
  }

  if (!jobLogsResult.data.stdout && !jobLogsResult.data.stderr) {
    return (
      <div className="bg-gray-600 text-gray-400 italic p-2 mb-4">
        Empty command output
      </div>
    );
  }

  return (
    <>
      {jobLogsResult.data.stdout && (
        <LogOutputPanel output={jobLogsResult.data.stdout} label="stdout" />
      )}
      {jobLogsResult.data.stderr && (
        <LogOutputPanel output={jobLogsResult.data.stderr} label="stderr" />
      )}
    </>
  );
};

const LogOutputPanel = ({ output, label }) => (
  <div className="relative bg-gray-600 text-gray-400 font-mono whitespace-pre-line p-2 mb-4">
    <div className="absolute top-0 right-0 pl-8 p-2 text-base bg-gradient-to-r from-transparent via-gray-600 to-gray-600 text-blue uppercase">
      {label}
    </div>
    {output}
  </div>
);

function taskClasses(status) {
  switch (status) {
    case "running":
      return ["bg-orange", "text-gray-800"];
    case "done":
      return ["bg-green", "text-white"];
    case "error":
      return ["bg-red", "text-white"];
    case "canceled":
      return ["bg-gray-500", "text-white"];
    default:
      return ["bg-gray-400", "text-gray-800"];
  }
}

export default App;
