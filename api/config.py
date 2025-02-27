import os

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    FLASK_APP = os.environ.get("FLASK_APP") or "manage.py"
    FLASK_CONFIG = os.environ.get("FLASK_CONFIG") or "default"
    SECRET_KEY = os.environ.get("SECRET_KEY") or "my_precious"
    SECURITY_PASSWORD_SALT = os.environ.get("SECURITY_PASSWORD_SALT") or "password_salt"
    # UPLOAD_TOKEN = os.environ.get("UPLOAD_TOKEN")
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "smtp.googlemail.com")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", "587"))
    MAIL_USE_TLS = os.environ.get("MAIL_USE_TLS", "true").lower() in ["true", "on", "1"]
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME") or "admin@test.com"
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD") or "123456"
    APP_MAIL_RESIVER = "resivermail@mail.com"
    APP_MAIL_SUBJECT_PREFIX = "[Subject]"
    ADMIN_CREDENTIALS_MAIL = (
        os.environ.get("ADMIN_CREDENTIALS_MAIL") or "admin@test.com"
    )
    ADMIN_CREDENTIALS_PASS = os.environ.get("ADMIN_CREDENTIALS_PASS") or "123456"
    SSL_REDIRECT = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_RECORD_QUERIES = True

    # Celery
    CELERY_CONFIG = {
        "broker_url": os.environ.get("CELERY_BROKER_URL") or "redis://localhost:6379/0",
        "result_backend": os.environ.get("CELERY_RESULT_BACKEND")
        or "redis://localhost:6379/0",
    }

    CACHE_CONFIG = {
        "CACHE_TYPE": "redis",
        "CACHE_REDIS_URL": os.environ.get("CACHE_REDIS_URL")
        or "redis://localhost:6379/0",
    }

    TIMEZONE = "America/Sao_Paulo"
    # Number of times a password is hashed
    BCRYPT_LOG_ROUNDS = 12

    import datetime

    PERMANENT_SESSION_LIFETIME = datetime.timedelta(days=1)

    APP_POSTS_PER_PAGE = 20
    APP_FOLLOWERS_PER_PAGE = 50
    APP_COMMENTS_PER_PAGE = 30
    APP_SLOW_DB_QUERY_TIME = 0.5

    # File Upload Settings
    BASE_DIR = basedir

    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50Mb
    IMG_UPLOAD_EXTENSIONS = [".jpg", ".png"]
    UPLOAD_IMGS_PATH = os.path.join(basedir, "db_imgs")

    SECURITY_UNAUTHORIZED_VIEW = "/api/auth/login"
    SECURITY_REDIRECT_BEHAVIOR = "spa"

    SPATIALITE_MOD = os.path.join(basedir, "venv\\Scripts\\mod_spatialite.dll")

    TEMP_DIRECTORY = os.path.join(basedir, "temp")

    @staticmethod
    def init_app(app):
        pass


class DevelopmentConfig(Config):
    DEBUG = True
    DEBUG_TB_INTERCEPT_REDIRECTS = False

    import logging

    LOG_LEVEL = logging.DEBUG
    LOG_FILENAME = "activity_dev.log"
    LOG_MAXBYTES = 1024
    LOG_BACKUPS = 2
    # Database choice
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL"
    ) or "sqlite:///" + os.path.join(basedir, "db", "app.sqlite")
    # SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:Emgp#1960@localhost:5432/MLTurb_data'
    SQLALCHEMY_TRACK_MODIFICATIONS = True
    FORKED_BY_MULTIPROCESSING = 1


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(basedir, "test.sqlite")
    WTF_CSRF_ENABLED = False
    # LOGIN_DISABLED  = True

    import logging

    LOG_LEVEL = logging.DEBUG
    LOG_FILENAME = "activity_test.log"
    LOG_MAXBYTES = 1024
    LOG_BACKUPS = 2


class ProductionConfig(Config):
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL"
    ) or "sqlite:///" + os.path.join(basedir, "db", "app.sqlite")

    import logging

    LOG_LEVEL = logging.DEBUG
    LOG_FILENAME = "activity.log"
    LOG_MAXBYTES = 1024
    LOG_BACKUPS = 2

    @classmethod
    def init_app(cls, app):
        Config.init_app(app)

        # email errors to the administrators
        # import logging
        # from logging.handlers import SMTPHandler

        # credentials = None
        # secure = None
        # if getattr(cls, "MAIL_USERNAME", None) is not None:
        #     credentials = (cls.MAIL_USERNAME, cls.MAIL_PASSWORD)
        #     if getattr(cls, "MAIL_USE_TLS", None):
        #         secure = ()
        # mail_handler = SMTPHandler(
        #     mailhost=(cls.MAIL_SERVER, cls.MAIL_PORT),
        #     fromaddr=cls.MAIL_USERNAME,
        #     toaddrs=[cls.APP_MAIL_RESIVER],
        #     subject=cls.APP_MAIL_SUBJECT_PREFIX + "- Application Error",
        #     credentials=credentials,
        #     secure=secure,
        # )
        # mail_handler.setLevel(logging.ERROR)
        # app.logger.addHandler(mail_handler)


class HerokuConfig(ProductionConfig):
    SSL_REDIRECT = True if os.environ.get("DYNO") else False

    @classmethod
    def init_app(cls, app):
        ProductionConfig.init_app(app)

        # handle reverse proxy server headers
        try:
            from werkzeug.middleware.proxy_fix import ProxyFix
        except ImportError:
            from werkzeug.contrib.fixers import ProxyFix
        app.wsgi_app = ProxyFix(app.wsgi_app)

        # log to stderr
        import logging
        from logging import StreamHandler

        file_handler = StreamHandler()
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)


class DockerConfig(ProductionConfig):
    SPATIALITE_MOD = "/usr/local/lib/mod_spatialite"
    CONFIRM_USER_URL = (
        os.environ.get("CONFIRM_USER_URL") or "http://localhost:80/confirm-user"
    )

    @classmethod
    def init_app(cls, app):
        ProductionConfig.init_app(app)

        # log to stderr
        import logging
        from logging import StreamHandler

        file_handler = StreamHandler()
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)


class UnixConfig(ProductionConfig):
    @classmethod
    def init_app(cls, app):
        ProductionConfig.init_app(app)

        # log to syslog
        import logging
        from logging.handlers import SysLogHandler

        syslog_handler = SysLogHandler()
        syslog_handler.setLevel(logging.INFO)
        app.logger.addHandler(syslog_handler)


config = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "heroku": HerokuConfig,
    "docker": DockerConfig,
    "raspi": UnixConfig,
    "default": DevelopmentConfig,
}
