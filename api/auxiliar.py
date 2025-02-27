import sys
import linecache
from sqlalchemy import NUMERIC, Integer
from geoalchemy2.types import Geometry


def PrintException():
    exc_type, exc_obj, tb = sys.exc_info()
    f = tb.tb_frame
    lineno = tb.tb_lineno
    filename = f.f_code.co_filename
    linecache.checkcache(filename)
    line = linecache.getline(filename, lineno, f.f_globals)
    print(f'EXCEPTION IN ({filename}, LINE {lineno} "{ line.strip()}"): {exc_obj}')
    return f'EXCEPTION IN ({filename}, LINE {lineno} "{ line.strip()}"): {exc_obj}'


# add it to env.py
def custom_compare_type(context, inspected_column, metadata_column, inspected_type, metadata_type):
    # return False if the metadata_type is the same as the inspected_type
    # or None to allow the default implementation to compare these
    # types. a return value of True means the two types do not
    # match and should result in a type change operation.
    if (isinstance(inspected_type, NUMERIC) or isinstance(inspected_type, Integer)) and isinstance(
        metadata_type, Geometry
    ):
        return False

    return None


def custom_include_object(object, name, type_, reflected, compare_to):
    if type_ == "table" and reflected and compare_to is None:
        return False
    else:
        return True
