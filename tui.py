from src.lib import CourseTable, IGNORE_WEEKEND;
from tui_utils import (
    check_schedule_download,
    get_schedule_filepath,
    get_output_filepath,
    get_output_formats,
)

import os
import questionary, excel3img



check_schedule_download()

i_filepath = get_schedule_filepath()
i_filename = i_filepath.name.split('.')[0]
o_filepath = get_output_filepath()
formats = get_output_formats()

ct = CourseTable(i_filepath)

_re_run = True
while _re_run:
    _xlsx_path = o_filepath / f"{i_filename}.xlsx"
    _png_path  = o_filepath / f"{i_filename}.png"

    ct.prepare()
    ct.export(_xlsx_path)

    if "png" in formats:
        if "nt" != os.name.lower():
            print("  [ ERR ] Export to PNG is only supported on Windows.")
            break

        excel3img.export_img(str(_xlsx_path), str(_png_path), "Timetable", 
            "A1:F25" if IGNORE_WEEKEND else "A1:H25"
        )

        if questionary.confirm(
            "Check for generated PNG file",
            default=True,
        ).ask():
            os.startfile("{}".format(str(_png_path).replace("/", "\\")))

    if "xlsx" not in formats:
        os.remove(_xlsx_path)

    _re_run = questionary.confirm(
        "Re-Run to generate a new one",
        default=False,
    ).ask()

    print()
