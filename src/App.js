import "./App.css";
import { useMutation, useQuery, useQueryClient } from "react-query";
import format from "date-fns/format";
import { useState } from "react";

const getPipelines = async () => {
  const response = await fetch("/pipelines");
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

const getPipelinesJobs = async () => {
  const response = await fetch("/pipelines/jobs");
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

function App() {
  const [currentSelection, setCurrentSelection] = useState({
    job: null,
    task: null,
  });

  const pipelinesJobsResult = useQuery("pipelines/jobs", getPipelinesJobs, {
    refetchInterval: 2000,
  });

  return (
    <div className="grid grid-cols-12 h-full">
      <div className="col-span-3 bg-gray-700 p-4">
        <h2 className="text-2xl text-green-300 mb-4">Pipelines</h2>
        <PipelineList pipelinesJobsResult={pipelinesJobsResult} />
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
          />
        ) : null}
      </div>
    </div>
  );
}

const PipelineList = ({ pipelinesJobsResult }) => {
  const { isLoading, isError, data, error } = pipelinesJobsResult;

  const queryClient = useQueryClient();

  const startMutation = useMutation(
    (pipeline) =>
      fetch("/pipelines/schedule", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          pipeline,
        }),
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("pipelines/jobs");
      },
    }
  );

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
          startMutation.isLoading || (pipeline.running && !pipeline.concurrent);

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
              : "border-yellow-500"
          }`}
        >
          <div className="font-extralight text-lg text-white mb-2">
            {job.pipeline}
          </div>
          <div className="mb-2 grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm mr-2 text-indigo-400">Start</span>
              <span className="text-sm text-white mr-4">
                {format(new Date(job.start), "HH:mm:ss")}
              </span>
            </div>
            {job.completed && (
              <div>
                <span className="text-sm mr-2 text-indigo-400">End</span>
                <span className="text-sm text-white">
                  {format(new Date(job.end), "HH:mm:ss")}
                </span>
              </div>
            )}
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

const TaskDetail = ({ pipelinesJobsResult, currentSelection }) => {
  if (pipelinesJobsResult.isLoading || pipelinesJobsResult.isError) {
    return null;
  }

  let task = null;
  if (currentSelection.job && currentSelection.task) {
    const job = pipelinesJobsResult.data.jobs?.find(
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

      {task.stdout && (
        <div className="mb-4">
          <div className="text-base text-indigo-500 mb-2">STDOUT</div>
          <div className="bg-gray-800 text-gray-400 font-mono whitespace-pre-line p-2">
            {task.stdout}
          </div>
        </div>
      )}

      {task.stderr && (
        <div className="mb-4">
          <div className="text-base text-indigo-500 mb-2">STDERR</div>
          <div className="bg-gray-800 text-gray-400 font-mono whitespace-pre-line p-2">
            {task.stderr}
          </div>
        </div>
      )}
    </div>
  );
};

function taskBg(status) {
  switch (status) {
    case "running":
      return "bg-yellow-500";
    case "done":
      return "bg-green-600";
    case "error":
      return "bg-red-500";
    default:
      return "bg-gray-300";
  }
}

export default App;
