import xlsxwriter

from .consts import (
    HEX_LOOP, LIGHTER_CYCLE,
)



class PaintRule:
    Random = 200
    GroupByClass = 300

class ColorPalette:
    def __init__(self, palette:dict):
        self.palette = palette

    def get_palette(self) -> dict:
        return self.palette

    def pick_by_lable(self, index: int) -> xlsxwriter.color.Color:
        return xlsxwriter.color.Color(
            self.get_palette()[index]
        )

    def pick_by_lable_light(self, index: int) -> xlsxwriter.color.Color:
        _color_hex: str = self.get_palette()[index].upper()

        for _ in range(LIGHTER_CYCLE):
            _color_hex = "".join(HEX_LOOP[_single_hex] for _single_hex in _color_hex)

        return xlsxwriter.color.Color(
            _color_hex
        )
