from src.lib import ColorPalette, CourseTable, IGNORE_WEEKEND;

import os;
import questionary, excel3img;
from pathlib import Path;

DOWNLOAD_PATH = Path.home() / "Downloads";
SCHEDULE_FILENAME = "schedule.xls";
#WEBDRIVER_GRACE_TIME = 20;



if not os.path.exists(DOWNLOAD_PATH / SCHEDULE_FILENAME):
    _break = True;

    if questionary.confirm(
        f"Did you download `{SCHEDULE_FILENAME}` file",
        default=True,
    ).ask():
        _break = False;

    if not _break:
        ...
    else:
        raise Exception(f"You must download `{SCHEDULE_FILENAME}` from `elective.pku.edu.cn` first.");

        raise Exception("unreachable!();");


input_filepath = questionary.path(
    f"Choose downloaded `{SCHEDULE_FILENAME}` file",
    default=str( DOWNLOAD_PATH / SCHEDULE_FILENAME ),
).ask();
input_filename = '.'.join(
    Path(input_filepath)
    .name
    .split('.')[0]
);

output_filepath = f"./output/{input_filename}.xlsx";
output_filepath_png = output_filepath + ".png";

_re_run = True;
while _re_run:
    palette = ColorPalette();
    ct = CourseTable(input_filepath);
    ct.export(output_filepath, palette=palette);

    excel3img.export_img(output_filepath, output_filepath_png, "Timetable", 
        "A1:F25" if IGNORE_WEEKEND else "A1:H25"
    );

    if questionary.confirm(
        "Open resulted PNG file",
        default=True,
    ).ask():
        #import subprocess;
        #subprocess.Popen(["start", f"{output_filepath_png.replace("/", "\\")}"]);
        os.startfile(f"{output_filepath_png.replace("/", "\\")}");

    _re_run = questionary.confirm(
        "Re-Run to generate a new one",
        default=False,
    ).ask();
