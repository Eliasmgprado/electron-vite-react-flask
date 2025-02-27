import time
from celery.contrib.abortable import AbortableTask
from celery.exceptions import Ignore
from flask import jsonify, request, url_for
from app import models, celery
from . import api_bp


@api_bp.route("/celery_task", methods=["POST"])
def celery_task_route():
    # read json + reply
    data = request.get_json(force=True)
    # print(data)
    task = celery_task.apply_async(args=[data])
    # print(task.backend)
    return (
        jsonify({}),
        202,
        {"Location": url_for("api.taskstatus", task_id=task.id)},
    )


@celery.task(bind=True, base=AbortableTask)
def celery_task(self, data):
    # print(current_user_id)
    print("celery_task")
    print(data)
    sleep_time = data.get("time", 5)
    self.update_state(
        state="PROGRESS", meta={"status": f"Running task with sleep of {sleep_time}..."}
    )
    try:
        # wait for sleep_time seconds
        time.sleep(sleep_time)

        out = (lambda x: x)("DONE")  # task function
    except Exception as e:
        print(e)
        raise Ignore()

    if self.is_aborted():
        self.update_state(state="ABORTED", meta={"status": "Task was aborted"})
        return {"status": "Task aborted.", "abort": True}

    self.update_state(state="PROGRESS", meta={"status": "Completed"})

    return {"status": "Task completed!", "result": out}


@api_bp.route("/taskstatus/<task_id>")
def taskstatus(task_id):
    task = celery_task.AsyncResult(task_id)

    if task.state == "ABORTED":
        response = {
            "state": task.state,
        }

        if task.info:
            if "status" in task.info:
                response["status"] = task.info["status"]
        return response
    elif task.state == "PENDING":
        # job did not start yet
        response = {"state": task.state, "status": "Pending..."}
    elif task.state != "FAILURE":
        if task.info.get("abort", False):
            return {
                "state": "ABORTED",
            }
        response = {"state": task.state, "status": task.info.get("status", "")}
        if "result" in task.info:
            response["result"] = task.info["result"]
    else:
        # something went wrong in the background job
        response = {
            "state": task.state,
            "status": str(task.info),
        }  # this is the exception raised
    return jsonify(response)


@api_bp.route("/celery_task/cancel", methods=["POST"])
def celery_task_cancel():
    """
    Cancel Task
    """
    data = request.get_json(force=True)
    task_id = data.get("task_id")

    if task_id is None:
        return {
            "status": "Error",
            "message": "task_id is required to cancel the task.",
        }, 400

    print("Canceling Train Model Task")
    # print(data.get("task_id"))
    task = celery_task.AsyncResult(data.get("task_id"))
    task.abort()

    return {
        "status": "Task Canceled",
        "result": {},
    }
