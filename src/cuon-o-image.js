/**
  * cuon-o-image.js (c) 2014 matsuda
  *
  * 本ソフトウェアは、非商用利用の場合は出典を明記することで、ファイル名も
  * 含めそのまま("as is")使用する場合に限り、配布可能です。改変、もしくは商
  * 用利用される場合、バグに関してはご連絡(kouichi.matsuda＠gmail.com)下さい。
  */
var CuonImage = function() {
 this.g = new Uint8Array(9);
 this.table = new Uint8Array(256); // 変換表
 this.xyz = new Float32Array(3); // 透視変換後の座標
 this.c = new Array(4); // 4隅の点を表す添え字 ???
}

/**
  * rgba配列のピクセル値(RGBA)をグレースケール化し、gray配列に格納する
  * @param rgba グレースケール化するピクセル値の配列(Uint8ClampedArray)
  * @param gray グレースケール化した結果を格納する配列(Uint8ClampedArray)
  *         gray = new Uint8ClampedArray(width * height);
  * @param width, height rgba画像の幅、高さ
  * @return 輝度値の平均値
  */
CuonImage.prototype.toGray = function(rgba, gray) {
  var length = rgba.length;
  var total = 0; // 総輝度値とピクセル数
  for (var i = 0; i < length; i += 4) {
    // グレースケール値を計算
    var g = 0.30 * rgba[i + 0] + 0.59 * rgba[i + 1] + 0.11 * rgba[i + 2];
    gray[i/4] = g;
    total += g;
  }
  return total / (length / 4);
}

/**
  * gray配列に格納された輝度値を用いて画像を(x, y)の座標に描画する
  * @param gray 輝度値が格納された配列
  * @param x, y 描画する左上の座標
  * @param context 描画するcanvasの2d用のコンテキスト
  * @param imageData grayと同じ幅と高さを持つImageDataオブジェクト
  * @return なし
  */
CuonImage.prototype.drawGrayImage = function(gray, x, y, context, imageData) {
  var length = gray.length * 4;
  var rgba = new Uint8ClampedArray(length);

  for (var i = 0; i < length; i += 4) {
    rgba[i + 0] = gray[i/4];
    rgba[i + 1] = gray[i/4];
    rgba[i + 2] = gray[i/4];
    rgba[i + 3] = 255;
  }
  imageData.data.set(rgba); // imageDataに結果を設定する
  context.putImageData(imageData, x, y); // 画像の描画
}

/**
  * rgba配列に格納されたピクセル値を用いて画像を(x, y)の座標に描画する
  * @param context 描画するcanvasの2d用のコンテキスト
  * @param x, y 描画する左上の座標
  * @param imageData rgbaと同じ幅と高さを持つImageDataオブジェクト
  * @param rgba ピクセル値(RGBA)が格納された配列
  * @return なし
  */
CuonImage.prototype.drawColorImage = function(rgba, x, y, context, imageData) {
  imageData.data.set(rgba); // imageDataに結果を設定する
  context.putImageData(imageData, x, y); // 画像の描画
}

/**
  * contextで指定されたcanvasに(x1, y1)から(x2, y2)に線分を描画する
  * @param context 描画するcanvasの2d用のコンテキスト
  * @param x1, y1, x2, y2 線分の始点と終点
  * @param width, color 線分の幅(ピクセル単位)と色
  * @return なし
  */
CuonImage.prototype.drawLine = function(context, x1, y1, x2, y2, width, color) {
  context.beginPath();    // パスを開始する
  context.lineWidth = width;  // 線の太さ
  context.strokeStyle = color;   // 線の色
  context.moveTo(x1, y1); // 開始位置
  context.lineTo(x2, y2); // 次の位置
  context.closePath();    // パスを閉じる
  context.stroke(); // 線を描画する
}

/**
  * contextで指定されたcanvasに(x, y)を中心に半径rの円を描画する
  * @param context 描画するcanvasの2d用のコンテキスト
  * @param x, y, r  円の中心と半径
  * @param width, color 線分の幅(ピクセル単位)と色
  * @return なし
  */
CuonImage.prototype.drawCircle = function(context, x, y, r, width, color) {
  context.beginPath();    // パスを開始する
  context.lineWidth = width;  // 線の太さ
  context.strokeStyle = color;   // 線の色
  context.arc(x, y, r, 0, Math.PI * 2, true); // 次の位置
  context.closePath();    // パスを閉じる
  context.stroke(); // 線を描画する
}

/**
  * contextで指定されたcanvasに(x, y)を左上の座標として四角形を描画する
  * @param context 描画するcanvasの2d用のコンテキスト
  * @param x, y  四角形の左上隅の座標
  * @param width, height, color 四角形の幅と高さ(ピクセル単位)と色
  * @return なし
  */
CuonImage.prototype.drawRect = function(context, x, y, width, height, color) {
  context.strokeStyle = color;   // 線の色
  context.strokeRect(x, y, width, height); // 四角を描画する
}

/**
  * template画像がtarget画像との類似度をSADで調べる
  * @param template テンプレート画像(グレースケール、Uint8ClampedArray)
  * @param templateWidth, templateHeight テンプレート画像の幅、高さ
  * @param target ターゲット画像(グレースケール、Uint8ClampedArray)
  * @param targetWidth, targetHeight ターゲット画像の幅、高さ
  * @param thr 類似度の閾値(0.0~1.0) 0に近いほど似ている
  * @return 一致した場合 一致した左上の座標 {x: x, y: y}
  *         しない場合 null
  */
CuonImage.prototype.matchSAD = function(template, templateWidth, templateHeight, 
		  target, targetWidth, targetHeight, thr) {
  for (var y = 0; y < targetHeight - templateHeight + 1; y++) {
    for (var x = 0; x < targetWidth - templateWidth + 1; x++) {
      var r = 0; // 類似度
      // (x, y)にあるピクセルを左上端にして一致するか調べる
      for (var t_y = 0; t_y < templateHeight; t_y++) {
        for (var t_x = 0; t_x < templateWidth; t_x++) {
          var i = (x + t_x) + targetWidth * (y + t_y); // targetGrayの添え字
          var t_i = t_x + templateWidth * t_y;         // templateGrayの添え字

          r += Math.abs(target[i] - template[t_i]); // SADの計算
        }
      } 
      r /= (templateWidth * templateHeight * 256);
      if (r < thr) {  // 基準値より低いと類似している
	return {x: x, y: y};
      } else return null;
    }
  }
}

/**
  * gray配列の画像からエッジを抽出する
  * @param gray エッジを抽出するグレイスケール画像
  * @param width, height グレイスケール画像の幅と高さ
  * @param fx エッジ抽出に用いる水平方向のフィルタ
  * @param fy エッジ抽出に用いる垂直方向のフィルタ
  * @param amp 結果のエッジを何倍するか？
  * @param edge エッジが格納される配列
  *    edge = new Uint[8|16]Array(width * height);
  *    もしくは Float32Array(width * height)
  * @return なし
  */
CuonImage.prototype.toEdge = function(gray, width, height, fx, fy, amp, edge) {
  var g = this.g;
  var total = 0, n = 0;
  // コンボリューション処理する対象ピクセルの輝度値
  for (var y = 1; y < height - 1; y++) {
    for (var x = 1; x < width - 1; x++) {
      var i = x + y * width; 	// 処理しているピクセル(x, y)
      // (x, y)を中心とする3x3ピクセルの輝度値の取り出し
      g[0] = gray[x - 1 + (y - 1) * width];
      g[1] = gray[x     + (y - 1) * width];
      g[2] = gray[x + 1 + (y - 1) * width];
      g[3] = gray[x - 1 + (y    ) * width];
      g[4] = gray[i]; // g[x     + (y    ) * width];
      g[5] = gray[x + 1 + (y    ) * width];
      g[6] = gray[x - 1 + (y + 1) * width];
      g[7] = gray[x     + (y + 1) * width];
      g[8] = gray[x + 1 + (y + 1) * width];
      // コンボリューション処理(積和演算)
      var ex = fx[0] * g[0] + fx[1] * g[1] + fx[2] * g[2]
		+ fx[3] * g[3] + fx[4] * g[4] + fx[5] * g[5]
		+ fx[6] * g[6] + fx[7] * g[7] + fx[8] * g[8];
      var ey = fy[0] * g[0] + fy[1] * g[1] + fy[2] * g[2]
		+ fy[3] * g[3] + fy[4] * g[4] + fy[5] * g[5]
		+ fy[6] * g[6] + fy[7] * g[7] + fy[8] * g[8];
      // 両方のエッジの絶対値を足す
      var ez = edge[i] = amp * Math.sqrt(ex * ex + ey * ey);
      if (ez == 0) continue;
      total += ez; n++;
    }
  }
  return total / n;
}

/** 
 * gray配列の画像にガウスフィルタを適用する
  * @param width, height グレイスケール画像の幅と高さ
  * @param result フィルタ処理された画像
  *    result = new Uint8Array(width * height);
  * @return なし
  */
CuonImage.prototype.toGauss = function(gray, width, height, result) {
  // コンボリューション処理する対象ピクセルの輝度値
  var g = this.g;
  var total = 0;

  for (var y = 1; y < height - 1; y++) {
    for (var x = 1; x < width - 1; x++) {
      var i = x + y * width; 	// 処理しているピクセル(x, y)
      // (x, y)を中心とする3x3ピクセルの輝度値の取り出し
      g[0] = gray[x - 1 + (y - 1) * width];
      g[1] = gray[x     + (y - 1) * width];
      g[2] = gray[x + 1 + (y - 1) * width];
      g[3] = gray[x - 1 + (y    ) * width];
      g[4] = gray[i]; // g[x     + (y    ) * width];
      g[5] = gray[x + 1 + (y    ) * width];
      g[6] = gray[x - 1 + (y + 1) * width];
      g[7] = gray[x     + (y + 1) * width];
      g[8] = gray[x + 1 + (y + 1) * width];
      // コンボリューション処理(積和演算)
      result[i] = (1 * g[0] + 2 * g[1] + 1 * g[2]
	        + 2 * g[3] + 4 * g[4] + 2 * g[5]
	        + 1 * g[6] + 2 * g[7] + 1 * g[8]) / 16 + 0.5;
      total += result[i];
    }
  }
  return total / ((height - 2) * (width - 2));
}

/**
  * template画像がtarget画像と一致するかを調べる
  * @param template テンプレート画像(グレースケール、Uint8ClampedArray)
  * @param width, height テンプレート画像の幅、高さ
  * @param target ターゲット画像(グレースケール、Uint8ClampedArray)
  * @return 一致した場合 true
  */
CuonImage.prototype.match = function(template, width, height, target) {
  var total = template.length; // テンプレート画像のピクセル数
  var count = 0;               // 輝度値が一致したピクセルの個数を数える
  for (var t_y = 0; t_y < height; t_y++) {
    for (var t_x = 0; t_x < width; t_x++) {
      var t_i = t_x + width * t_y; // templateGrayの添え字(同じ画像なのでt_iだけ)

      if (target[t_i] === template[t_i]) count++; // 輝度値が同じか?
    }
  }
  if (count === total)          // 輝度が全部一致
    return true;
  else 
    return false;
}

// ブラウザ間のメソッド名の違いを吸収する
navigator.getUserMedia = navigator.getUserMedia
		|| navigator.webkitGetUserMedia
		|| navigator.mozGetUserMedia
		|| navigator.msGetUserMedia;

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (function() {
    return window.requestAnimationFrame ||
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           window.oRequestAnimationFrame ||
           window.msRequestAnimationFrame ||
           function(/* function FrameRequestCallback */ callback) {
             window.setTimeout(callback, 1000/30);
           };
  })();
}

/**
  * グレースケール画像を2値化する
  * @param gray グレースケール化した画像
  * @param thr しきい値
  * @param binary 2値化された画像
  *     binary = new Uint8Array(gray.length);
  * @return なし
  */
CuonImage.prototype.toBinary = function(gray, thr, binary) {
  for (var i = 0; i < ~~(thr + 0.5); i++) 
    this.table[i] = 0;
  for (var i = ~~(thr + 0.5); i < 256; i++)
    this.table[i] = 255; // 表を初期化する
 
  var length = gray.length;
  for (var i = 0; i < length; i++) {
    binary[i] = this.table[gray[i]]; // 表引きをする
  }
}

/**
  * グレースケール画像の輝度を反転する
  * @param gray グレースケール化した画像
  * @param reverse 輝度を反転した画像
  *     reverse = new Uint8Array(gray.length);
  * @return なし
  */
CuonImage.prototype.toReverse = function(gray, reverse) {
  var length = gray.length;
  for (var i = 0; i < length; i++) {
    reverse[i] = 255 - gray[i]; // 反転する
  }
}

/**
  * binary画像に対してハフ変換(直線)を行う
  * @param binary ハフ変換する画像(グレースケールか2値画像)
  * @param width, height binary画像の幅、高さ
  * @param MAX_THETA, MAX_RHO θ、ρの最大値
  * @param thetaRho θρ座標の累積値を格納する配列
  * @return なし
  */
CuonImage.prototype.houghLine = function(binary, width, height, MAX_THETA, MAX_RHO, thetaRho) {
  var max_rho = width * width + height * height; // 対角線の長さの2乗
  // 画像ファイルのサイズのチェック
  if (max_rho > MAX_RHO * MAX_RHO) {
    alert("画像ファイルが大きすぎる: 幅 " + width + "高さ" + height);
    return;
  }

  // 入力画像のピクセル値を読んで、ρ = x cosθ＋y sinθ で変換
  for (var y = 1; y < height - 1; y++) {
    for (var x = 1; x < width - 1; x++)	{
      if (binary[x + width * y] != 255) continue; // 点が見つかった
      // ρ = x cosθ＋y sinθを計算する
      for (var theta = 0; theta < MAX_THETA; theta++) {
        var radian = theta * 3.141592 / 180; // ラジアンへ変換する
        var drho = x * Math.cos(radian) + y * Math.sin(radian);
        // -MAX_RHOの場合に配列に入らないので+MAX_RHOする
        thetaRho[theta + maxTheta * (~~(drho + maxRho))]++; 
      }
    }
  }
}

/**
  * ハフ変換した結果から直線をMAX_LINES本見つける
  * @param thetaRho ハフ変換の結果得られたθρ空間
  * @prama MAX_THETA, MAX_RHO θ、ρの最大値
  * @prama MAX_LINES 見つける直線の本数
  * @param _theta MAX_LINES本の直線のθ(直線らしい順)
  *   var _theta = new Int32Array(MAX_LINES);
  * @param _rho MAX_LINES本の直線のρ(直線らしい順)
  *   var _rho = new Int32Array(MAX_LINES);
  * @return 見つかった直線の本数
  */
CuonImage.prototype.invHoughLine = function(thetaRho, MAX_THETA, MAX_RHO, MAX_LINES, _theta, _rho) {
  if (MAX_LINES <= 0) {
    console.log("見つける線の数が0以下: " + MAX_LINES);
    return -1;
  }

  var nLines = 0; // 見つかった線の本数
  for (var i = 0; i < MAX_LINES; i++) {
    var maxCount = -1; // カウントの最大値
    for (var theta = 0; theta < MAX_THETA; theta++) {
      for (var rho = -MAX_RHO; rho < MAX_RHO; rho++) {
        var count = thetaRho[theta + MAX_THETA * (rho + MAX_RHO)];
        if (count < maxCount) continue; // 最も大きな値を探す
        maxCount = count;
  	_theta[i] = theta; // θとρを記録しておく
	_rho[i] = rho;
      }
    }
    if (maxCount == 0) break; // もう線はないので中断する
    nLines++;
    // 1本見つかったので、次の直線を探すため近傍の直線を消しておく
    var MASK = 10;
    for (var theta = -MASK; theta <= MASK; theta++) {
      for (var rho = -MASK; rho <= MASK; rho++) {
        var t = _theta[i] + theta;
        var r = _rho[i] + rho;
        if ((t < 0 || MAX_THETA <= t) || (r < -MAX_RHO || MAX_RHO <=r)) continue;
        thetaRho[t + MAX_THETA * (r + MAX_RHO)] = 0;
      }
    }
  }
  return nLines;
}

/**
  * ハフ変換の結果得られた2直線の交点を求める
  * @param theta1, rho1 直線1のθ、ρ
  * @param theta2, rho2 直線2のθ、ρ
  * @param MAX_THETA 180°を何分割するか？
  * @return 交点の座標  {x: x, y: y}
  *         null 交わらない場合
  */
CuonImage.prototype.houghCross = function(theta1, rho1, theta2, rho2, MAX_THETA) {
  var radian1 = theta1 * Math.PI / MAX_THETA;
  var radian2 = theta2 * Math.PI / MAX_THETA;
  var d = Math.sin(radian1 - radian2);
  if (d == 0) return null;
  var x = (rho2 * Math.sin(radian1) - rho1 * Math.sin(radian2)) / d;
  var y = (rho1 * Math.cos(radian2) - rho2 * Math.cos(radian1)) / d;
  return {x: x, y: y};
}

/**
  * binaryで指定された2値画像の連結成分に番号を振る
  * @param binary ラベリングする2値画像
  * @param width, height 2値画像の幅と高さ
  * @param labels ラベリングされた結果
  *     var labels = new Uint16Array(width * height);
  * @param table 連結表
  *     var table = new Uint8Array(MAX_LABELS);
  * @param areas 面積の配列。[面積, ..., -1]
  *     var areas = new Int16Array(MAX_LABELS + 1);
  * @return なし
  */
CuonImage.prototype.labeling = function(binary, width, height, labels, table, areas) {
  // ラベル付けする
  var MAX_LABEL = table.length, MIN_LABEL = 10;
  for (var i = 0; i < MAX_LABEL; i++) table[i] = i; // 表を初期化する
  // ラベル付けした結果を格納する配列
  var curLabel = MIN_LABEL; // 現在のラベル(1-9は他の用途用)

  for (var y = 1; y < height - 1; y++) {
    for (var x = 1; x < width - 1; x++) {
      var i = x + y * width; 	// 処理しているピクセル(x, y)
      if (binary[i] !== 0) continue; // 0の部分を物体とする

      // (1) 左上、上、右上、左のラベルを取り出す
      var upperL = labels[(x - 1) + (y - 1) * width]; // 左上
      var upper =  labels[x + (y - 1) * width];       // 上
      var upperR = labels[(x + 1) + (y - 1) * width]; // 右上
      var left =   labels[(x - 1) + y * width];       // 左

      // 左上、上、右上、左のラベルのうち最も小さいものを探す
      var min = MAX_LABEL; // 最も大きなラベル＋1
      if (upperL != 0 && upperL < min) min = upperL;
      if (upper  != 0 && upper  < min) min = upper;
      if (upperR != 0 && upperR < min) min = upperR;
      if (left   != 0 && left   < min) min = left;
      
      if (min == MAX_LABEL) { // (2) 左上・上・右上・左にラベルがない
        labels[i] = curLabel; // 新しいラベルをつける
        curLabel++;
      } else {                // (3) ラベルがある
        labels[i] = min;      // ラベルの中で最小のものを用いる
        // 表に記録する(使っていないものだけを書き換える)
        if (upperL !== min) table[upperL] = min;
        if (upper !== min) table[upper] = min;
        if (upperR !== min) table[upperR] = min;
        if (left !== min) table[left] = min;
      }
    }
  }

  // (4) 表を引く
  for (var label = MIN_LABEL; label < curLabel; label++) {
    if (label === table[label]) continue;
    var min = table[label]; // 最も小さなラベルを探す
    while (table[min] < min) min = table[min];
    table[label] = min;  // 表の値を最も小さいラベルに直す
  }

  for (var y = 1; y < height - 1; y++) {
    for (var x = 1; x < width - 1; x++) {
      var i = x + y * width; 	// 処理しているピクセル(x, y)
      if (labels[i] === 0) continue; // 0は読み飛ばす
      var label = table[labels[i]];
      labels[i] = label; // 表を引く。表のラベルで書き換え
      areas[label]++;       // 面積を計算する
    }
  }
  areas[curLabel] = -1;
}

/** 
  * (x, y)にあるピクセル値(ラベル番号)を取り出す。
  * ラベルが0の場合は、0を返す。0以外の場合は、以下を返す。
  * labelと一致するか、調査済み(値が1)場合は、
  * そのピクセルを調査済みとマークして、変更前のラベル番号を返す。
  * いずれでもない場合は、-1 を返す。
  * @params labels ラベリングされた画像
  * @params label 輪郭を追跡するラベル
  * @params x, y 画像内にあるかどうかを調べる座標
  * @params width, height 画像の幅と高さ
  * @return -1 ラベルは存在するが一致しない
  * @return 0 ラベルがない
  * @return >= 1 調査済みもしくはラベルが一致した場合のラベル
  */
CuonImage.prototype.getLabel = function(labels, label, x, y, width, traced) {
  var i = x + y * width;
  var cur_label = labels[i]; // 今あるラベル

  if (cur_label === 0) return 0; // ラベルがない
  if (traced[i] === 1) return 1; // 追跡済み
  if (cur_label === label) {
    traced[i] = 1; // 追跡済みにする
    return cur_label; // 追跡済みにする前のラベルを返す
  }
  return -1; // ラベルは存在するが、labelと一致しない(ここには来ない)
}

/**
  * ラベリング画像から指定されたラベル番号の連結成分の輪郭を
  * 構成するピクセルの座標をpointsに返す
  * @params laebls ラベリングされた画像
  * @params width, height ラベリングされた画像の幅と高さ
  * @params label 輪郭追跡するラベル番号
  * @params points 追跡された輪郭を構成するピクセルの座標[x, y, ..., 0]
  * @return > 0 周囲長
  * @return 0 labelが孤立点、もしくは、見つからなかった
  var MAX_CHAIN = 10000;  // 輪郭を構成するピクセル数の最大値
  var points = new Uint16Array(MAX_CHAIN * 2); // ピクセルの座標[x, y, ..., 0]
  var traced = new Uint8Array(width * height); // 追跡済みのピクセル
  */
CuonImage.prototype.trace = function(labels, width, height, label, points, traced) {
  var MAX_CHAIN = points.length / 2; // (x, y)と入っているから
  // 輪郭を追跡し始めるピクセル(開始点)を探す
  var ROOT2 = 1.41421356; // 斜めの線の周囲長計算用 Math.sqrt(2);
  var left_label= 0; // 左のピクセルのラベル((1)用)

  for (var y = 1; y < height - 1; y++) { // ラベリング画像が対象なので1で始まる
    for (var x = 1; x < width - 1; x++) {
      var i = x + y * width;
      if (labels[i] !== label) continue; // ラベルを取り出す
      if (label === 0) { left_label = 0; continue; } // ラベルなしは読み飛ばす
      if (traced[i] === 1) { left_label = label; continue; }  // (2) 調査済みは読み飛ばす
      if (left_label !== 0) continue; // (1) 0 -> labelの検出
      left_label = label; // 左のピクセルのラベルに設定する

      var length = 0;  // 周囲長
      var start_x = x, start_y = y; // 開始点の場所を覚えておく
      traced[i] = 1;    // 開始点を調査済みにする

      // (3) 孤立点のチェック(左下、下、右下、右)
      if (this.getLabel(labels, label, x - 1, y + 1, width, height, traced) <= 0)   // 左下
        if (this.getLabel(labels, label, x, y + 1, width, height, traced) <=0)      // 下
          if (this.getLabel(labels, label, x + 1, y + 1, width, height, traced) <= 0) // 右下
            if (this.getLabel(labels, label, x + 1, y, width, height, traced) <= 0)   // 右
              return 0; // 孤立点  

      var dir = 2; // どの方向からチェックするか
      var num = 0; // 座標を配列のどこに格納するかを示す
      var loop = true; 

      while (loop) {  // (4) 開始点と追跡点が同じ座標なるまで追跡する
        points[num] = x; points[num + 1] = y; num += 2;      // 座標を覚えておく
        if (num > MAX_CHAIN * 2) { loop = false; continue; } // 最大数を超えたので終了
        if (x === start_x && y === start_y) loop = false;   // 追跡が終わりそう

        switch (dir) {
          case 0: // 左上を調べる
            var l = this.getLabel(labels, label, x - 1, y - 1, width, traced);
            if (l > 0) {
              if (!loop && l === 1) continue; // (5) 追跡終了
              else loop = true;
              x = x - 1;  y = y - 1; length += ROOT2;
              dir = 6; continue;
            }
          case 1: // 左を調べる
            var l = this.getLabel(labels, label, x - 1, y, width, traced);
            if (l > 0) {
              if (!loop && l == 1) continue;  // (5) 追跡終了
              else loop = true;
              x = x - 1; length++;
              dir = 0; continue;
            }
          case 2: // 左下を調べる
            var l = this.getLabel(labels, label, x - 1, y + 1, width, traced);
            if (l > 0) {
              if (!loop && l == 1) continue; // (5) 追跡終了
              else loop = true;
              x = x - 1; y = y + 1; length += ROOT2;
              dir = 0; continue;
            }
          case 3: // 下を調べる
            var l = this.getLabel(labels, label, x, y + 1, width, traced);
            if (l > 0) {
              if (!loop && l == 1) continue; // (5) 追跡終了
              else loop = true;
              y = y + 1; length++;
              dir = 2; continue;
            }
          case 4: // 右下を調べる
            var l = this.getLabel(labels, label, x + 1, y + 1, width, traced);
            if (l > 0) {
              if (!loop && l == 1) continue; // (5) 追跡終了
              else loop = true;
              x = x + 1; y = y + 1; length += ROOT2;
              dir = 2; continue;
            }
          case 5: // 右を調べる
            var l = this.getLabel(labels, label, x + 1, y, width, traced);
            if (l > 0) {
              if (!loop && l == 1) continue; // (5) 追跡終了
              else loop = true;
              x = x + 1; length++;
              dir = 4; continue;
            }
          case 6: // 右上を調べる
            var l = this.getLabel(labels, label, x + 1, y - 1, width, traced);
            if (l > 0) {
              if (!loop && l == 1) continue; // (5) 追跡終了
              else loop = true;
              x = x + 1; y = y - 1; length += ROOT2;
              dir = 4; continue;
            }
          case 7: // 上を調べる
            var l = this.getLabel(labels, label, x, y - 1, width, traced);
            if (l > 0) {
              if (!loop && l == 1) continue; // (5) 追跡終了
              else loop = true;
              y = y - 1; length++;
              dir = 6; continue;
            }
          dir = 0;
        }
      } // while(loop)
      points[num] = 0; // 最後に0を入れておく
    }
  }
}

/**
  * 90度ずつ回転したマーカーの画像を作成する
  * @param marker 元のマーカーの画像のImageDataオブジェクト(正方形)
  * @param size 一辺の大きさ
  * @param rad90 90°のラジアン
  * @param context 2D描画用のコンテキスト
  * @param markers 90°ずつ回転した画像4つからなら配列
  *  var markers = new Array(4); // 90°回転したマーカーを格納する配列
  *  markers[0] = new Uint8ClampedArray(MARKER_SIZE * MARKER_SIZE); // もとのマーカー
  *  markers[1] = new Uint8ClampedArray(MARKER_SIZE * MARKER_SIZE); // 90°回転させたマーカー
  *  markers[2] = new Uint8ClampedArray(MARKER_SIZE * MARKER_SIZE); // 180°回転させたマーカー
  *  markers[3] = new Uint8ClampedArray(MARKER_SIZE * MARKER_SIZE); // 270°回転させたマーカー
  * @return なし
  */
CuonImage.prototype.getRotatedMarkers = function(marker, size, rad90, context, markers) {
  var width = marker.width, height = marker.height;
  for (var i = 0; i < 4; i++) {
    context.save();
    context.translate(width / 2, height / 2); // [1] 原点を画像の中心に移動
    context.rotate(rad90 * i);                // [2] 画像を回転する
    context.translate(-width / 2, -height / 2); // [3] 原点を元の位置に移動
    context.drawImage(marker, 0, 0, size, size);  // 画像を描画
    var imageData = context.getImageData(0, 0, size, size); // ピクセルの取り出し
    var thr = this.toGray(imageData.data, markers[i]); // グレースケール化
    this.toBinary(markers[i], thr, markers[i]); // 2値化
    context.restore();
  }
}

/**
  * 4点からできる四角形が凸四角形か?
  * @param corners 4点の座標 [x, y, ...]
  * @return trueかfalse
  */
CuonImage.prototype.checkRectangle = function(corners) {
  var x1 = corners[0], y1 = corners[1]; // (x1, y1) - (x2, y2)
  var x3 = corners[2], y3 = corners[3]; // (x3, y3) - (x4, y4)
  var x2 = corners[4], y2 = corners[5];
  var x4 = corners[6], y4 = corners[7];
  var d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
  if (d === 0) return false;
  var r =((y4 - y3) * (x3 - x1) - (x4 - x3) * (y3 - y1)) / d;
  var s =((y2 - y1) * (x3 - x1) - (x2 - x1) * (y3 - y1)) / d;
  if ((0 < r && r <= 1) && (0 < s && s <= 1)) return true;
  return false;
}

/**
  * points配列内のindex0の点(x0, y0)とindex1の点(x1, y1)が作る直線と
  * indexPの点(px, py)までの距離
  * @param points 輪郭線を構成するピクセルの座標[x, y, ..., 0]
  * @param indexP, index0, index1 上記の3点を示す配列の添え字
  * @return 距離
  */
CuonImage.prototype.distancePointAndLine = function(points, indexP, index0, index1) {
  var px = points[indexP], py = points[indexP + 1];
  var x0 = points[index0], y0 = points[index0 + 1];
  var x1 = points[index1], y1 = points[index1 + 1];

  var dx = x1 - x0, dy = y1 - y0;
  var a = dx * dx + dy * dy; // 点(x1, y1)と点(x2, y2)が同じ場合、aは0
  if (a === 0) return (x0 - px) * (x0 - px) + (y0 - py) * (y0 - py);
  var b = dx * (x0 - px) + dy * (y0 - py);
  var t = -(b / a);
  t = (t < 0.0)? 0.0: (t > 1.0)? 1.0 : t; // clamp処理
  var x = x0 + dx * t; // (px, py)からの垂線との交点
  var y = y0 + dy * t; // (px, py)からの垂線との交点
  return (x - px) * (x - px) + (y - py) * (y - py);
}

/**
  * 画像内の4隅の点の座標から透視変換行列を求めmatrixに返す
  * @param corners 4隅を表す座標 [x, y, ..., 0] 反時計回り
  * @param width, height 透視変換前の長方形の幅と高さ
  * @param matirx 透視変換行列を返す3x3行列 matrix = new Float32Array(9);
  * @return なし
  */
CuonImage.prototype.getHomography = function(corners, width, height, matrix) {
  var x0 = corners[0], y0 = corners[1];
  var x1 = corners[2], y1 = corners[3];
  var x2 = corners[4], y2 = corners[5]; 
  var x3 = corners[6], y3 = corners[7];

  var sx = (x0 - x3) + (x2 - x1);
  var sy = (y0 - y3) + (y2 - y1);
	
  var dx1 = x3 - x2;
  var dx2 = x1 - x2;
  var dy1 = y3 - y2;
  var dy2 = y1 - y2;
 
  var z = (dx1 * dy2) - (dx2 * dy1);
  var g = ((sx * dy2) - (sy * dx2)) / z;
  var h = ((sy * dx1) - (sx * dy1)) / z;
  
  var a = (x3 - x0 + g * x3);
  var d = (y3 - y0 + g * y3);
  var b = (x1 - x0 + h * x1);
  var e = (y1 - y0 + h * y1);
  var c = x0;
  var f = y0;

  matrix[0] = a / width; matrix[3] = b / height; matrix[6] = c;
  matrix[1] = d / width; matrix[4] = e / height; matrix[7] = f;
  matrix[2] = g / width; matrix[5] = h / height; matrix[8] = 1;
}

/**
  * 3x3行列に(x, y, z)を乗算する
  * @param matrix 3x3行列(1次元配列、列優先)
  * @param x, y, z matrixに乗算するベクトル
  * @param xyz 結果を格納する配列。xyz = new Float32Array(3);
  */
CuonImage.prototype.multMatrix3Vec3 = function(matrix, x, y, z, xyz) {
  xyz[0] = matrix[0] * x + matrix[3] * y + matrix[6] * z;
  xyz[1] = matrix[1] * x + matrix[4] * y + matrix[7] * z;
  xyz[2] = matrix[2] * x + matrix[5] * y + matrix[8] * z;
}

/**
  * binaryで指定された画像をwidth x heightのサイズに正面を向ける
  * @param binary 2値画像
  * @param matrix 透視変換行列(3x3)
  * @param width, height binaryの幅、高さ
  * @param xyz 透視変換後の座標(作業用)
  * @param tMarker matixで座標変換された画像
  *  tMarker = new Uint8ClampedArray(MEMO_W * MEMO_H);
  */
CuonImage.prototype.transform = function(binary, width, height, matrix, tMarker, twidth, theight) {
  for (var y = 0; y < theight; y++) { // 正面を向ける
    for (var x = 0; x < twidth; x++) {
      this.multMatrix3Vec3(matrix, x, y, 1, this.xyz); // 座標変換する
      var o_i = ~~(this.xyz[0] / this.xyz[2] + 0.5) + (~~(this.xyz[1] / this.xyz[2] + 0.5)) * width;
      var t_i = x + y * twidth;
      tMarker[t_i] = binary[o_i];
    }
  }
}

/**
  * points配列の中の点の座標から四隅を表す点の座標をcorners配列に返す
  * @param points 輪郭線を構成するピクセルの座標 [x, y, ..., 0]
  * @param corners 4隅の点の座標 [x, y, ...]
  *        corners = new Uint16ArrayArray(4 * 2);
  * @return なし
  */
CuonImage.prototype.find4Corners = function(points, corners) {
  this.c[0] = this.findFarthestPoint(points, 0, points.length, 0);
  this.c[2] = this.findFarthestPoint(points, 0, points.length, this.c[0]);
  this.c[1] = this.findFarthestPointFrom2(points, this.c[0],this.c[2],this.c[0],this.c[2]);
  this.c[3] = this.findFarthestPointFrom2(points,this.c[2],this.c[0],this.c[0],this.c[2]);

  var n = 0;
  for (var i = 0; i < 4; i++) {
    corners[n] = points[this.c[i]], corners[n + 1] = points[this.c[i] + 1];
    n += 2;
  }
}

/**
  * points配列のstart番目からend番目までの座標の中から
  * indexが示す点の座標(x, y)から最も遠い点を探す
  * @param points 輪郭線を構成するピクセルの座標[x, y, ..., 0]
  * @param start, end 点を探す範囲
  * @param index 上記の点を示す配列の添え字
  * @return 最も遠い点の添え字
  */
CuonImage.prototype.findFarthestPoint = function(points, start, end, index) {
  var x = points[index], y = points[index + 1];
  var far_index = 0;   
  var max_length = 0;
  for (var i = start; i < end && points[i] !== 0; i += 2) {
    var dx = points[i] - x, dy = points[i + 1] - y;
    var length = dx * dx + dy * dy;
    if (max_length > length) continue;
    max_length = length, far_index = i;
  }
  return far_index;
}

/**
  * points配列内のstart番目からend番目の座標の中から、
  * index0, index1が作る直線から最も遠い点の添え字を返す
  * @param points 輪郭線を構成するピクセルの座標[x, y, ..., 0]
  * @param start, end 点を探す範囲
  * @param index0, index1 上記の2点を示す配列の添え字
  * @return 最も遠い点の添え字
  */
CuonImage.prototype.findFarthestPointFrom2 = function(points, start, end, index0, index1) {
  var far_index = 0;  // 最も遠い点
  var max_length = 0; // 最も遠い距離
  if (start < end) {
    for (var i = start; i < end && points[i] !== 0; i += 2) {
      var length = this.distancePointAndLine(points, i, index0, index1);
      if (max_length > length) continue;
      max_length = length, far_index = i;
    }
    return far_index;
  }
  // endがstartより小さい場合は、end～最後と0～startで分ける
  for (var i = start; points[i] !== 0; i += 2) {
    var length = this.distancePointAndLine(points, i, index0, index1);
    if (max_length > length) continue;
     max_length = length, far_index = i;
  }
  for (var i = 0; i < end; i += 2) {
    var length = this.distancePointAndLine(points, i, index0, index1);
    if (max_length > length) continue;
     max_length = length, far_index = i;
  }
  return far_index;
}
