import xlsxwriter, json, questionary;

from .consts import (
    HEX_LOOP, LIGHTER_CYCLE,
);



"""
def _hex_to_oklab(_hex: str):
    _rgb = numpy.array( colour.notation.HEX_to_RGB(_hex) ) / 255.0;
    _xyz = colour.sRGB_to_XYZ(_rgb);
    _oklab = colour.XYZ_to_Oklab(_xyz);
    return _oklab;

def _oklab_to_hex(_oklab):
    _xyz = colour.Oklab_to_XYZ(_oklab);
    _rgb = colour.XYZ_to_sRGB(_xyz);
    #_rbg = numpy.clip(_rgb, 0, 1);
    _hex = colour.notation.RGB_to_HEX(_rgb);
    return _hex;
"""

class ColorPalette:
    def __init__(self, palette_name=None):
        _jsonpath = questionary.path(
            "Select `palette.json` to use",
            default="./palette.json",
        ).ask();

        with open(_jsonpath, "r") as jsonfile:
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

    """ limited color space and lightness(L value) sensitivity is too high
    def _pick_from_oklab(self, index: int) -> xlsxwriter.color.Color:
        _hex = self._get_palette()[index];
        _oklab = _hex_to_oklab(_hex);
        _oklab[0] = TITLE_LIGHT;
        _hex = _oklab_to_hex(_oklab);
        return _hex;
    """
