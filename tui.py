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

        from time import sleep;
        from selenium import webdriver;
        from selenium.webdriver.edge.options import Options as EdgeOptions;
        from selenium.webdriver.support.ui import WebDriverWait;
        from selenium.webdriver.support import expected_conditions as EC;

        options = EdgeOptions();
        options.use_chromium = True;
        # Use `Incognito` `Edge` browser and set log-level to `error`
        options.add_argument("--inprivate");
        options.add_argument("--log-level=3");

        driver = webdriver.Edge(options=options);

        # Download `schedule.xls` with selenium from PKU website
        _URL_login_to_elective = "https://iaaa.pku.edu.cn/iaaa/oauth.jsp?appID=syllabus&appName=%E5%AD%A6%E7%94%9F%E9%80%89%E8%AF%BE%E7%B3%BB%E7%BB%9F&redirectUrl=http://elective.pku.edu.cn:80/elective2008/ssoLogin.do";
        print("  [ INF ] Redirecting to login page...");
        driver.get(_URL_login_to_elective);
        WebDriverWait(driver, WEBDRIVER_GRACE_TIME).until(EC.url_changes(_URL_login_to_elective));

        #   - Verify Login success
        _URL_elective_index_root = "https://elective.pku.edu.cn/elective2008/edu/pku/stu/elective";
        for i in range(WEBDRIVER_GRACE_TIME):
            sleep(1);
            if _URL_elective_index_root in driver.current_url:
                print(f"  [ INF ] PKU Login Success")
                break;
            elif i+1 == WEBDRIVER_GRACE_TIME:
                raise Exception(f"  [ ERR ] Failed to login PKU SSO sign-in. Please check connectivity to PKU website.");

        #   - Page to download `schedule.xls`
        _URL_export_to_excel = "https://elective.pku.edu.cn/elective2008/edu/pku/stu/elective/controller/electiveWork/showResults.do";
        print("  [ INF ] Redirecting to page for export schedule...");
        driver.get(_URL_export_to_excel);

        for i in range(WEBDRIVER_GRACE_TIME):
            sleep(1);
            if os.path.exists(DOWNLOAD_PATH / SCHEDULE_FILENAME):
                break;
            elif i+1 == WEBDRIVER_GRACE_TIME:
                raise Exception(f"  [ ERR ] Failed to download `{SCHEDULE_FILENAME}`. Please check connectivity to PKU website.");

        driver.quit();



input_filepath = questionary.path(
    f"Choose downloaded `{SCHEDULE_FILENAME}` file",
    default=str( DOWNLOAD_PATH / SCHEDULE_FILENAME ),
).ask();
input_filename = '.'.join(
    Path(input_filepath)
    .name
    .split('.')[:-1]
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
