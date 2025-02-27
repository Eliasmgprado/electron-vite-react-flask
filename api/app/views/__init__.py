from flask import Blueprint
import math

api_bp = Blueprint("api", __name__)

# Create a user blueprint
userbp = Blueprint("userbp", __name__)



@api_bp.context_processor
def utility_processor():
    def toDegreesMinutesAndSeconds(coordinate):
        absolute = abs(coordinate)
        degrees = math.floor(absolute)
        minutesNotTruncated = (absolute - degrees) * 60
        minutes = math.floor(minutesNotTruncated)
        seconds = math.floor((minutesNotTruncated - minutes) * 60)

        return f"{degrees}\u00B0 {minutes}' {seconds}\""

    def _dd2dms(dd, lng):
        if dd:
            dms = toDegreesMinutesAndSeconds(dd)
        else:
            return ""

        if lng:
            cardinal = " E" if dd >= 0 else " W"
        else:
            cardinal = " N" if dd >= 0 else " S"

        return dms + cardinal

    return dict(dd2dms=_dd2dms)


from . import main, celery_route
