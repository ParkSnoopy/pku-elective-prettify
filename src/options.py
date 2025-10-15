import json, questionary

from .palette import ColorPalette, PaintRule



class GenerateOptions:
	def __init__(self):
		self.palette = self._ask_palette()
		self.paint_rule = self._ask_paint_rule()

	def _ask_palette(self) -> str:
		_jsonpath = questionary.path(
			"Select `palette.json` to use",
			default="./palette.json",
		).ask()

		with open(_jsonpath, "r") as jsonfile:
			_full_palette = json.load(jsonfile)

		_palette_name = questionary.select(
			"Choose a palette to use",
			choices=_full_palette.keys(),
		).ask()

		return ColorPalette(
			palette=_full_palette[_palette_name],
		)

	def _ask_paint_rule(self) -> PaintRule:
		if questionary.confirm(
			"Paint the same class with the same color?",
			default=True
		).ask():
			return PaintRule.GroupByClass
		else:
			return PaintRule.Random

		raise Exception("unreachable!();")
