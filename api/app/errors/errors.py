from flask import jsonify
from werkzeug.http import HTTP_STATUS_CODES


def error_response(status_code, message=None):
    payload = {"error": HTTP_STATUS_CODES.get(status_code, "Unknown error")}
    if message:
        payload["message"] = message
    payload["status"] = "fail"
    payload["status_code"] = status_code
    # response = jsonify(payload)
    # response.status_code = status_code
    return payload, status_code


def unauthorized(message):
    payload = {"error": "Not Authorized", "message": message, "status": "fail"}
    # response = jsonify({"error": "Não autorizado.", "message": message, "status": "fail"})
    # response.status_code = 401
    return payload, 401


def forbidden(message):
    payload = {"error": "Forbidden Access.", "message": message, "status": "fail"}
    # response = jsonify({"error": "Acesso Proibido.", "message": message, "status": "fail"})
    # response.status_code = 403
    return payload, 403


def server_error(message):
    payload = {"error": "Server Error.", "message": message, "status": "fail"}
    return payload, 500


def bad_request(message):
    return error_response(400, message)
