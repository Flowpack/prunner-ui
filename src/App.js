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
  const [taskDetail, setTaskDetail] = useState(null);

  return (
    <div className="grid grid-cols-12 h-full">
      <div className="col-span-3 bg-gray-700 p-4">
        <h2 className="text-2xl text-green-300 mb-4">Pipelines</h2>
        <PipelineList />
      </div>
      <div className="col-span-3 bg-gray-600 p-4 overflow-hidden overflow-y-scroll">
        <h2 className="text-2xl text-green-400 mb-4">Jobs</h2>
        <JobsList setTaskDetail={setTaskDetail} />
      </div>
      <div className="col-span-6 bg-gray-700 p-4">
        <TaskDetail task={taskDetail} />
      </div>
    </div>
  );
}

const PipelineList = () => {
  const { isLoading, isError, data, error } = useQuery(
    "pipelines",
    getPipelines
  );

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
        queryClient.invalidateQueries("jobs");
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
      {data.map((pipeline) => (
        <div
          key={pipeline.pipeline}
          className="p-4 mb-4 border-gray-400 border-2"
        >
          <div className="text-lg text-white mb-4">{pipeline.pipeline}</div>
          {pipeline.running ? (
            <button
              className="border-2 border-gray-400 text-white w-8 h-8"
              disabled={startMutation.isLoading}
            >
              ◼︎
            </button>
          ) : (
            <button
              className="border-2 border-gray-400 text-white w-8 h-8"
              disabled={startMutation.isLoading}
              onClick={() => {
                startMutation.mutate(pipeline.pipeline);
              }}
            >
              ▶︎
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

const JobsList = ({ setTaskDetail }) => {
  const { isLoading, isError, data, error } = useQuery(
    "jobs",
    getPipelinesJobs,
    { refetchInterval: 2000 }
  );

  if (isLoading) {
    return <span>Loading...</span>;
  }

  if (isError) {
    return <span>Error: {error.message}</span>;
  }

  return (
    <div className="">
      {data.map((job) => (
        <div
          key={job.id}
          className={`p-4 mb-4 border-2 ${
            job.completed ? "border-green-600" : "border-yellow-500"
          }`}
        >
          <div className="text-lg text-white mb-2">{job.pipeline}</div>
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
                // TODO task details are not updated on refetches this way
                onClick={() => setTaskDetail(task)}
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

const TaskDetail = ({ task }) => {
  if (!task) {
    return null;
  }

  return (
    <div>
      <div className="text-2xl text-gray-300 mb-4">
        <span className="text-green-500">Task</span> {task.name}
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
