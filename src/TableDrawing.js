class TableDrawing {
	constructor(el, htOption) {
		this._el = el
		this._htOption = htOption
	}

	/**
	 * Draw the QRCode
	 *
	 * @param {QRCode} oQRCode
	 */
	draw(oQRCode) {
		const _htOption = this._htOption
		const _el = this._el
		const nCount = oQRCode.getModuleCount()
		const nWidth = Math.floor(_htOption.width / nCount)
		const nHeight = Math.floor(_htOption.height / nCount)
		const aHTML = ['<table style="border:0; border-collapse:collapse; ">']

		for (let row = 0; row < nCount; row++) {
			aHTML.push("<tr>")

			for (let col = 0; col < nCount; col++) {
				aHTML.push(
					'<td style="border:0; border-collapse:collapse; padding:0; margin:0; width:' +
						nWidth +
						"px; height:" +
						nHeight +
						"px; background-color:" +
						(oQRCode.isDark(row, col) ? _htOption.colorDark : _htOption.colorLight) +
						';"></td>'
				)
			}

			aHTML.push("</tr>")
		}

		aHTML.push("</table>")
		_el.innerHTML = aHTML.join("")

		// Fix the margin values as real size.
		const elTable = _el.childNodes[0]
		const nLeftMarginTable = (_htOption.width - elTable.offsetWidth) / 2
		const nTopMarginTable = (_htOption.height - elTable.offsetHeight) / 2

		if (nLeftMarginTable > 0 && nTopMarginTable > 0) {
			elTable.style.margin = nTopMarginTable + "px " + nLeftMarginTable + "px"
		}
	}

	/**
	 * Clear the QRCode
	 */
	clear() {
		this._el.innerHTML = ""
	}
}
