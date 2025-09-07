from pathlib import Path;



# Safety: this file must be next to `main.py` file
SCRIPT_PATH = Path(__file__).parent;

PALETTE_SIZE = 5;
LIGHTER_CYCLE = 2;

IGNORE_WEEKEND = True;
EN2CN_NUM_MAP = {
    1: "一",
    2: "二",
    3: "三",
    4: "四",
    5: "五",
    6: "六",
    7: "七",
    8: "八",
    9: "九",
    10: "十",
    11: "十一",
    12: "十二",
};
CLASS_TIME_MAP = {
    1 : "08:00 ~ 08:50",
    2 : "09:00 ~ 09:50",
    3 : "10:10 ~ 11:00",
    4 : "11:10 ~ 12:00",
    5 : "13:00 ~ 13:50",
    6 : "14:00 ~ 14:50",
    7 : "15:10 ~ 16:00",
    8 : "16:10 ~ 17:00",
    9 : "17:10 ~ 18:00",
    10: "18:40 ~ 19:30",
    11: "19:40 ~ 20:30",
    12: "20:40 ~ 21:30",
};

_hex_loop = "0123456789ABCDEF";
HEX_LOOP = {
    _hex_loop[i]: _hex_loop[i+1] if i < len(_hex_loop)-1 else _hex_loop[i] for i,v in enumerate(_hex_loop)
};
HEX_LOOP.update({"#":"#"});
