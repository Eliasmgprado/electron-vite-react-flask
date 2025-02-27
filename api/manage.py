import os
from dotenv import load_dotenv

# Load .env variables
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

from flask_migrate import Migrate
from app import create_app, db, models
from app.models import *  # Models Tables
from auxiliar import custom_compare_type, custom_include_object
# from cli import register_cli
from flask_cors import CORS

app = create_app(os.getenv("FLASK_CONFIG") or "default")
# register_cli(app)
CORS(app, expose_headers="Location")
# manager = Manager(app)
migrate = Migrate(
    app,
    db,
    render_as_batch=True,
    compare_type=custom_compare_type,
    include_object=custom_include_object,
)


@app.shell_context_processor
def make_shell_context():
    return dict(app=app, db=db, models=models)


from waitress import serve

if __name__ == "__main__":
    print("SERVER RUNNING")
    print(os.getenv("FLASK_CONFIG"))
    print(os.getenv("DATABASE_URL"))
    serve(app, listen="0.0.0.0:5000")
    # app.run(use_debugger=False, use_reloader=False, passthrough_errors=True)
