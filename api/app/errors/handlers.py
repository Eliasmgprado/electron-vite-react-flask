from flask import render_template, request
from .. import db
from ..errors import errors_bp
from ..errors.errors import error_response as api_error_response

def wants_json_response():
    print("______----------___________----------_________")
    print(request.accept_mimetypes)
    return request.accept_mimetypes['application/json'] >= \
        request.accept_mimetypes['text/html']
        
        
@errors_bp.app_errorhandler(405)
def not_found_error(error):
    return api_error_response(405)

@errors_bp.app_errorhandler(404)
def not_found_error(error):
    # if wants_json_response():
    return api_error_response(404)
    # return render_template('error.html'), 404

@errors_bp.app_errorhandler(500)
def internal_error(error):
    db.session.rollback()
    # if wants_json_response():
    return api_error_response(500)
    # return render_template('error.html'), 500

@errors_bp.app_errorhandler(400)
def internal_error(error):
    db.session.rollback()
    return api_error_response(400)