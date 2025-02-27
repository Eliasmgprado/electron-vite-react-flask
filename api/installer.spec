# -*- mode: python ; coding: utf-8 -*-

# CHANGE "datas" attribute of Analysis if needed

main_a = Analysis(
    ['manage.py'],
    pathex=['venv\\Lib\\site-packages'],
    binaries=[],
    datas=[ ('app/errors', 'app/errors'), ('app/models', 'app/models'), ('app/views', 'app/views'), ('app/__init__.py', 'app'), ('app/logger_setup.py', 'app'), ('.env', '.'), ('auxiliar.py', '.'), ('celery_worker.py', '.'), ('config.py', '.'), ('redis', 'redis')],
    hiddenimports=['celery.fixups', 'celery.fixups.django', 'celery.loaders.app', 'celery.app.amqp', 'kombu.transport.redis', 'celery.backends', 'celery.backends.redis', 'celery.app.events'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[('runtime_hook.py')],
    excludes=[],
    noarchive=False,
)
main_pyz = PYZ(main_a.pure)

main_exe = EXE(
    main_pyz,
    main_a.scripts,
    [],
    exclude_binaries=True,
    name='API_EXE_NAME', #CHANGE
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='..\\build\\icon.ico'
)


celery_a = Analysis(
    ['celery_worker_main.py'],
    pathex=['venv\\Lib\\site-packages'],
    binaries=[],
    datas=[ ('app/errors', 'app/errors'), ('app/models', 'app/models'), ('app/views', 'app/views'), ('app/__init__.py', 'app'), ('app/logger_setup.py', 'app'), ('.env', '.'), ('auxiliar.py', '.'), ('celery_worker.py', '.'), ('config.py', '.')],
    hiddenimports=['celery.fixups', 'celery.fixups.django', 'celery.loaders.app', 'celery.app.amqp', 'kombu.transport.redis', 'celery.backends', 'celery.backends.redis', 'celery.app.events', 'cryptography'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)
celery_pyz = PYZ(celery_a.pure)

celery_exe = EXE(
    celery_pyz,
    celery_a.scripts,
    [],
    exclude_binaries=True,
    name='celery_worker',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='..\\build\\icon.ico'
)

coll = COLLECT(
    main_exe,
    main_a.binaries,
    main_a.datas,
    celery_exe,
    celery_a.binaries,
    celery_a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='API_NAME', #CHANGE
)
