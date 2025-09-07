import xlsxwriter, json, questionary;

from consts import (
    SCRIPT_PATH, HEX_LOOP, LIGHTER_CYCLE, 
);



class ColorPalette:
    def __init__(self, palette_name=None):

        with open(SCRIPT_PATH / "palette.json", "r") as jsonfile:
            self._full_palette = json.load(jsonfile);

        if not palette_name:
            palette_name = self._choose_palette_by_user();
        self._name = palette_name;

    def _choose_palette_by_user(self) -> str:
        return questionary.select(
            "Choose a palette to use",
            choices=self._full_palette.keys(),
        ).ask();

    def _get_palette(self) -> dict:
        # Raise error when palette name not exists
        return self._full_palette[self._name];

    def pick_by_lable(self, index: int) -> xlsxwriter.color.Color:
        return xlsxwriter.color.Color(
            self._get_palette()[index]
        );

    def pick_by_lable_light(self, index: int) -> xlsxwriter.color.Color:
        _color_hex: str = self._get_palette()[index].upper();

        for _ in range(LIGHTER_CYCLE):
            _color_hex = "".join(HEX_LOOP[_single_hex] for _single_hex in _color_hex);

        return xlsxwriter.color.Color(
            _color_hex
        );
