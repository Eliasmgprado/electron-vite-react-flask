from . import api_bp


@api_bp.route("/about")
def about():
    """
    Obter informações do sistema

    Retorna um JSON com informações do sistema.
    """
    print("ABOUT")
    return {
        "api": "API NAME",
        "version": "1.0",
        "author": "Author Name",
        "company": "Company Name",
    }
