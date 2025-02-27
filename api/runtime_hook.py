import os
import sys
import atexit
from subprocess import (
    Popen,
    CREATE_NEW_CONSOLE,
    DETACHED_PROCESS,
    CREATE_NEW_PROCESS_GROUP,
    CREATE_NO_WINDOW,
    PIPE,
)
import win32api
import win32con


if getattr(sys, "frozen", False):
    basedir = os.path.abspath(
        os.path.join(os.path.dirname(sys.executable), "_internal")
    )
    celery_worker_call = os.path.join(
        os.path.dirname(sys.executable), "celery_worker.exe"
    )
elif __file__:
    basedir = os.path.abspath(os.path.dirname(__file__))
    celery_worker_call = [
        sys.executable or "python",
        "-m",
        os.path.join(basedir, "celery_worker_main.py"),
    ]

os.environ["PYTHONPATH"] = basedir


redis_proc = Popen(
    os.path.join(basedir, "redis\\redis-server.exe"),
    creationflags=DETACHED_PROCESS,
    close_fds=True,
)

if getattr(sys, "frozen", False):
    celery_proc = Popen(
        celery_worker_call,
        creationflags=CREATE_NO_WINDOW,
        close_fds=True,
        **({"stdout": PIPE} if not getattr(sys, "frozen", False) else {}),
    )
else:
    from celery_worker_main import start_worker

    start_worker()

# react_proc = Popen(
#     'npx local-web-server --port 3000 --directory build --spa index.html --rewrite "/api/(.*) -> http://127.0.0.1:5000/api/$1"',
#     creationflags=CREATE_NEW_PROCESS_GROUP,
#     close_fds=True,
#     cwd=os.path.join(basedir, "frontEnd"),
#     shell=True,
#     stdout=PIPE,
# )


def exit_handler(event=win32con.CTRL_C_EVENT):
    if event in [
        win32con.CTRL_C_EVENT,
        win32con.CTRL_LOGOFF_EVENT,
        win32con.CTRL_BREAK_EVENT,
        win32con.CTRL_SHUTDOWN_EVENT,
        win32con.CTRL_CLOSE_EVENT,
    ]:

        print("EXIT App")
        # redis_proc.kill()
        # redis_proc.wait()
        try:
            celery_proc.kill()
            celery_proc.wait()
        except:
            print("Celery Proc not found")
        # Popen("TASKKILL /F /PID {pid} /T".format(pid=react_proc.pid))
        Popen(os.path.join(basedir, "redis\\redis-cli.exe shutdown"))


# if not getattr(sys, "frozen", False):
#     exit_handler()
atexit.register(exit_handler)
win32api.SetConsoleCtrlHandler(exit_handler, 1)
