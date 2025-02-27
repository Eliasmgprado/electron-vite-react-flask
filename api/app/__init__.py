from flask import Flask
from flask_sqlalchemy import SQLAlchemy

# from flask_security import Security, SQLAlchemyUserDatastore
# from flask_bcrypt import Bcrypt
# from flask_mail import Mail
from celery import Celery

# from flask_debugtoolbar import DebugToolbarExtension
# from apifairy import APIFairy
# from flask_marshmallow import Marshmallow
from flask_caching import Cache

# from flask_login import LoginManager
from config import config, Config
from sqlalchemy import MetaData


import logging
import sys

# from app import models, admin
# from app.momentjs import momentjs

# from auxiliar import PrintException
import os

basedir = os.path.dirname(os.path.abspath(__file__))

metadata = MetaData(
    naming_convention={
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(column_0_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s",
    }
)

db = SQLAlchemy(metadata=metadata)
# bcrypt = Bcrypt() # password encryption
# security = Security()
# mail = Mail() # mail server
# toolbar = DebugToolbarExtension()
celery = Celery(__name__, broker=Config.CELERY_CONFIG["broker_url"])
# apifairy = APIFairy()
# ma = Marshmallow()
cache = Cache(config=Config.CACHE_CONFIG)


def create_app(config_name):
    app = Flask(
        __name__,
    )
    print("Running Config: ", config_name)
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)

    # Init MarshMallow schema objects
    # ma.init_app(app)

    # Setup the logger
    app.logger.addHandler(logging.StreamHandler(sys.stdout))
    app.logger.setLevel(logging.ERROR)

    # Setup the database
    # db = SQLAlchemy(app)
    db.init_app(app)

    # Setup the password crypting
    # bcrypt = Bcrypt(app)
    # bcrypt.init_app(app)

    from app import models

    # Setup Security
    # from app.models.user import User, Role

    # user_datastore = SQLAlchemyUserDatastore(db, User, Role)
    # security_state = security.init_app(app, user_datastore)
    # security._state = security_state

    # Setup the mail server
    # mail.init_app(app)

    # Cache
    cache.init_app(app)

    # # Setup the debug toolbar
    # app.config["DEBUG_TB_TEMPLATE_EDITOR_ENABLED"] = True
    # app.config["DEBUG_TB_PROFILER_ENABLED"] = True
    # toolbar.init_app(app)

    # Initialize Celery
    init_celery(app)

    # app.jinja_env.globals["momentjs"] = momentjs

    with app.app_context():
        from app.logger_setup import logger

        # from .filters import filters
        # from app import admin

        # from app.auth import auth_bp

        # app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")

        from app.errors import errors_bp

        app.register_blueprint(errors_bp)

        from .views import api_bp

        app.register_blueprint(api_bp, url_prefix="/api/v1")

        # @event.listens_for(db.engine, "connect")
        # def load_spatialite(dbapi_conn, connection_record):
        #     # From https://geoalchemy-2.readthedocs.io/en/latest/spatialite_tutorial.html
        #     dbapi_conn.enable_load_extension(True)
        #     # path = os.path.join(app.root_path, "..\\venv\\Scripts\\mod_spatialite.dll")
        #     path = app.config["SPATIALITE_MOD"]
        #     # print(path)

        #     tries = 0

        #     while tries < 3:

        #         try:
        #             dbapi_conn.load_extension(path)
        #             # print("SpatiaLite Loaded")
        #             tries = 3
        #         except:
        #             tries += 1
        #             time.sleep(5)
        #             print("Cant Connnect to mod_spatialite")

        # try:
        #     db.reflect()

        #     # print(User.query.count())
        #     if not sqlalchemy.inspect(db.engine).has_table(User.__tablename__):
        #         print("NOT DB USER TABLE")
        #         initdb(app, db, models)
        #     else:
        #         pass
        #         # user_count = User.query.count()
        #         # if user_count == 0:
        #         #     print("Creating ADMIN User with default credentials")
        #         #     createAdmin(app, db, models, False)
        # except:
        #     print("Error while connecting to DB.")

    return app


def init_celery(app):
    celery.conf.update(app.config["CELERY_CONFIG"])

    class ContextTask(celery.Task):
        """Make celery tasks work with Flask app context"""

        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery


# @celery.on_after_configure.connect
# def setup_periodic_tasks(sender, **kwargs):
#     sender.add_periodic_task(300.0, clearTempDirectory, name="Clear Temp Directory")
