class Polynomial {
	constructor(num, shift) {
		if (num.length == undefined) {
			throw new Error(num.length + "/" + shift)
		}
		let offset = 0
		while (offset < num.length && num[offset] == 0) {
			offset++
		}
		this.num = new Array(num.length - offset + shift)
		for (let i = 0; i < num.length - offset; i++) {
			this.num[i] = num[i + offset]
		}
	}

	get(index) {
		return this.num[index]
	}

	getLength() {
		return this.num.length
	}

	multiply(e) {
		const num = new Array(this.getLength() + e.getLength() - 1)
		for (let i = 0; i < this.getLength(); i++) {
			for (let j = 0; j < e.getLength(); j++) {
				num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)))
			}
		}
		return new Polynomial(num, 0)
	}

	mod(e) {
		if (this.getLength() - e.getLength() < 0) {
			return this
		}
		const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0))
		const num = new Array(this.getLength())
		for (let i = 0; i < this.getLength(); i++) {
			num[i] = this.get(i)
		}
		for (let i = 0; i < e.getLength(); i++) {
			num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio)
		}
		return new Polynomial(num, 0).mod(e)
	}
}

const QRMode = {
	MODE_NUMBER: 1 << 0,
	MODE_ALPHA_NUM: 1 << 1,
	MODE_8BIT_BYTE: 1 << 2,
	MODE_KANJI: 1 << 3
}

const QRErrorCorrectLevel = {
	L: 1,
	M: 0,
	Q: 3,
	H: 2
}

const QRMaskPattern = {
	PATTERN000: 0,
	PATTERN001: 1,
	PATTERN010: 2,
	PATTERN011: 3,
	PATTERN100: 4,
	PATTERN101: 5,
	PATTERN110: 6,
	PATTERN111: 7
}

const QRUtil = {
	PATTERN_POSITION_TABLE: [
		[],
		[6, 18],
		[6, 22],
		[6, 26],
		[6, 30],
		[6, 34],
		[6, 22, 38],
		[6, 24, 42],
		[6, 26, 46],
		[6, 28, 50],
		[6, 30, 54],
		[6, 32, 58],
		[6, 34, 62],
		[6, 26, 46, 66],
		[6, 26, 48, 70],
		[6, 26, 50, 74],
		[6, 30, 54, 78],
		[6, 30, 56, 82],
		[6, 30, 58, 86],
		[6, 34, 62, 90],
		[6, 28, 50, 72, 94],
		[6, 26, 50, 74, 98],
		[6, 30, 54, 78, 102],
		[6, 28, 54, 80, 106],
		[6, 32, 58, 84, 110],
		[6, 30, 58, 86, 114],
		[6, 34, 62, 90, 118],
		[6, 26, 50, 74, 98, 122],
		[6, 30, 54, 78, 102, 126],
		[6, 26, 52, 78, 104, 130],
		[6, 30, 56, 82, 108, 134],
		[6, 34, 60, 86, 112, 138],
		[6, 30, 58, 86, 114, 142],
		[6, 34, 62, 90, 118, 146],
		[6, 30, 54, 78, 102, 126, 150],
		[6, 24, 50, 76, 102, 128, 154],
		[6, 28, 54, 80, 106, 132, 158],
		[6, 32, 58, 84, 110, 136, 162],
		[6, 26, 54, 82, 110, 138, 166],
		[6, 30, 58, 86, 114, 142, 170]
	],
	G15: (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
	G18: (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
	G15_MASK: (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1),
	getBCHTypeInfo: function(data) {
		let d = data << 10
		while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
			d ^= QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15))
		}
		return ((data << 10) | d) ^ QRUtil.G15_MASK
	},
	getBCHTypeNumber: function(data) {
		let d = data << 12
		while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
			d ^= QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18))
		}
		return (data << 12) | d
	},
	getBCHDigit: function(data) {
		let digit = 0
		while (data != 0) {
			digit++
			data >>>= 1
		}
		return digit
	},
	getPatternPosition: function(typeNumber) {
		return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1]
	},
	getMask: function(maskPattern, i, j) {
		switch (maskPattern) {
			case QRMaskPattern.PATTERN000:
				return (i + j) % 2 == 0
			case QRMaskPattern.PATTERN001:
				return i % 2 == 0
			case QRMaskPattern.PATTERN010:
				return j % 3 == 0
			case QRMaskPattern.PATTERN011:
				return (i + j) % 3 == 0
			case QRMaskPattern.PATTERN100:
				return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0
			case QRMaskPattern.PATTERN101:
				return ((i * j) % 2) + ((i * j) % 3) == 0
			case QRMaskPattern.PATTERN110:
				return (((i * j) % 2) + ((i * j) % 3)) % 2 == 0
			case QRMaskPattern.PATTERN111:
				return (((i * j) % 3) + ((i + j) % 2)) % 2 == 0
			default:
				throw new Error("bad maskPattern:" + maskPattern)
		}
	},
	getErrorCorrectPolynomial: function(errorCorrectLength) {
		let a = new Polynomial([1], 0)
		for (let i = 0; i < errorCorrectLength; i++) {
			a = a.multiply(new Polynomial([1, QRMath.gexp(i)], 0))
		}
		return a
	},
	getLengthInBits: function(mode, type) {
		if (1 <= type && type < 10) {
			switch (mode) {
				case QRMode.MODE_NUMBER:
					return 10
				case QRMode.MODE_ALPHA_NUM:
					return 9
				case QRMode.MODE_8BIT_BYTE:
					return 8
				case QRMode.MODE_KANJI:
					return 8
				default:
					throw new Error("mode:" + mode)
			}
		} else if (type < 27) {
			switch (mode) {
				case QRMode.MODE_NUMBER:
					return 12
				case QRMode.MODE_ALPHA_NUM:
					return 11
				case QRMode.MODE_8BIT_BYTE:
					return 16
				case QRMode.MODE_KANJI:
					return 10
				default:
					throw new Error("mode:" + mode)
			}
		} else if (type < 41) {
			switch (mode) {
				case QRMode.MODE_NUMBER:
					return 14
				case QRMode.MODE_ALPHA_NUM:
					return 13
				case QRMode.MODE_8BIT_BYTE:
					return 16
				case QRMode.MODE_KANJI:
					return 12
				default:
					throw new Error("mode:" + mode)
			}
		} else {
			throw new Error("type:" + type)
		}
	},
	getLostPoint: function(matrixBarcode) {
		const moduleCount = matrixBarcode.getModuleCount()
		let lostPoint = 0
		for (let row = 0; row < moduleCount; row++) {
			for (let col = 0; col < moduleCount; col++) {
				let sameCount = 0
				const dark = matrixBarcode.isDark(row, col)
				for (let r = -1; r <= 1; r++) {
					if (row + r < 0 || moduleCount <= row + r) {
						continue
					}
					for (let c = -1; c <= 1; c++) {
						if (col + c < 0 || moduleCount <= col + c) {
							continue
						}
						if (r == 0 && c == 0) {
							continue
						}
						if (dark == matrixBarcode.isDark(row + r, col + c)) {
							sameCount++
						}
					}
				}
				if (sameCount > 5) {
					lostPoint += 3 + sameCount - 5
				}
			}
		}
		for (let row = 0; row < moduleCount - 1; row++) {
			for (let col = 0; col < moduleCount - 1; col++) {
				let count = 0
				if (matrixBarcode.isDark(row, col)) count++
				if (matrixBarcode.isDark(row + 1, col)) count++
				if (matrixBarcode.isDark(row, col + 1)) count++
				if (matrixBarcode.isDark(row + 1, col + 1)) count++
				if (count == 0 || count == 4) {
					lostPoint += 3
				}
			}
		}
		for (let row = 0; row < moduleCount; row++) {
			for (let col = 0; col < moduleCount - 6; col++) {
				if (
					matrixBarcode.isDark(row, col) &&
					!matrixBarcode.isDark(row, col + 1) &&
					matrixBarcode.isDark(row, col + 2) &&
					matrixBarcode.isDark(row, col + 3) &&
					matrixBarcode.isDark(row, col + 4) &&
					!matrixBarcode.isDark(row, col + 5) &&
					matrixBarcode.isDark(row, col + 6)
				) {
					lostPoint += 40
				}
			}
		}
		for (let col = 0; col < moduleCount; col++) {
			for (let row = 0; row < moduleCount - 6; row++) {
				if (
					matrixBarcode.isDark(row, col) &&
					!matrixBarcode.isDark(row + 1, col) &&
					matrixBarcode.isDark(row + 2, col) &&
					matrixBarcode.isDark(row + 3, col) &&
					matrixBarcode.isDark(row + 4, col) &&
					!matrixBarcode.isDark(row + 5, col) &&
					matrixBarcode.isDark(row + 6, col)
				) {
					lostPoint += 40
				}
			}
		}
		let darkCount = 0
		for (let col = 0; col < moduleCount; col++) {
			for (let row = 0; row < moduleCount; row++) {
				if (matrixBarcode.isDark(row, col)) {
					darkCount++
				}
			}
		}
		const ratio = Math.abs((100 * darkCount) / moduleCount / moduleCount - 50) / 5
		lostPoint += ratio * 10
		return lostPoint
	}
}

const QRMath = {
	glog: function(n) {
		if (n < 1) {
			throw new Error("glog(" + n + ")")
		}
		return QRMath.LOG_TABLE[n]
	},
	gexp: function(n) {
		while (n < 0) {
			n += 255
		}
		while (n >= 256) {
			n -= 255
		}
		return QRMath.EXP_TABLE[n]
	},
	EXP_TABLE: new Array(256),
	LOG_TABLE: new Array(256)
}
for (let i = 0; i < 8; i++) {
	QRMath.EXP_TABLE[i] = 1 << i
}
for (let i = 8; i < 256; i++) {
	QRMath.EXP_TABLE[i] =
		QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8]
}
for (let i = 0; i < 255; i++) {
	QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i
}

export { Polynomial, QRMode, QRErrorCorrectLevel, QRMaskPattern, QRUtil, QRMath }
