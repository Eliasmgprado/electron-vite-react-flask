import os

from dotenv import load_dotenv

import celery.app.amqp
import celery.app.log
import celery.worker.autoscale
import celery.worker.components
import celery.bin
import celery.utils
import celery.utils.dispatch
import celery.contrib.testing
import celery.utils.static
import celery.concurrency.prefork
import celery.concurrency.solo
import celery.app.events
import celery.events.state
import celery.app.control
import celery.backends.redis
import celery.backends
import celery.backends.database
import celery.worker
import celery.worker.consumer
import celery.app
import celery.loaders
import celery.fixups
import celery.concurrency
import celery.events
import celery.contrib
import celery.apps
import celery
import celery.fixups
import celery.fixups.django
import celery.apps.worker
import celery.worker.strategy
import kombu.transport.redis
import sqlalchemy.sql.default_comparator
import sqlalchemy.ext.baked

from app import celery, create_app


dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

app = create_app(os.getenv("FLASK_CONFIG") or "default")


def start_worker():
    worker = celery.Worker(loglevel="info", pool="solo", logfile="celery.log")
    worker.start()


if __name__ == "__main__":
    start_worker()
