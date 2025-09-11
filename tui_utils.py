import os, questionary;
from pathlib import Path;

DESKTOP_PATH = Path.home() / "Desktop";
DOWNLOAD_PATH = Path.home() / "Downloads";
SCHEDULE_FILENAME = "schedule.xls";



def check_schedule_download():
    if not os.path.exists(DOWNLOAD_PATH/SCHEDULE_FILENAME):
        if not questionary.confirm(
            f"Did you download `{SCHEDULE_FILENAME}` file",
            default=True,
        ).ask():
            raise Exception(f"You must download `{SCHEDULE_FILENAME}` from `elective.pku.edu.cn` first.");

def get_schedule_filepath() -> Path:
    default_input_filepath = str(DOWNLOAD_PATH/SCHEDULE_FILENAME);
    input_filepath = Path(questionary.path(
        f"Choose downloaded `{SCHEDULE_FILENAME}` file",
        default=default_input_filepath,
    ).ask());
    return input_filepath;

def get_output_filepath() -> Path:
    default_output_filepath = str(DESKTOP_PATH);
    output_filepath = Path(questionary.path(
        f"Path to export",
        default=default_output_filepath,
    ).ask());
    return output_filepath;

def get_output_formats() -> list:
    _format_raw = questionary.select(
        f"Format to export",
        choices=[
            "png",
            "xlsx",
            "BOTH",
        ],
    ).ask();
    _formats = list();
    match _format_raw:
        case "png":
            _formats.append("png");
        case "xlsx":
            _formats.append("xlsx");
        case "BOTH":
            _formats.append("png");
            _formats.append("xlsx");

    return _formats;
