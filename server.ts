import { serveDir } from "https://deno.land/std@0.151.0/http/file_server.ts";

Deno.serve(async (req) => {
  const pathname = new URL(req.url).pathname;
  console.log(pathname);

  const sheet_id = Deno.env.get("SHEET_ID");
  const sheet_name = Deno.env.get("SHEET_NAME");
  const api_key = Deno.env.get("API_KEY");

  const json = fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheet_id}/values/${sheet_name}?key=${api_key}`,
  );

  let jsonData = await json.then((response) => {
    return response.json();
  });
  let values = jsonData.values;

  // 日付の重複除去
  var dates: string[] = [];
  for (var i = 1; i < values.length; i++) {
    dates.push(values[i][0]);
  }
  var uniqueDates = Array.from(new Set(dates));
  for (var i = 0; i < uniqueDates.length; i++) {
    var counter = 1;
    for (var j = 1; j < values.length; j++) {
      if (uniqueDates[i] == values[j][0]) {
        values[j][0] += `#${counter}`;
        dates[j-1] = values[j][0];
        counter += 1;
      }
    }
  }

  // 個人スコアまとめ
  const rank_pt3 = [40, 0, -25];
  const back_pt = 40000;
  var nan3_scores: { [key: string]: any } = {};
  var players: string[] = [];
  for (var i = 1; i < values.length; i++) {
    if (values[i][2] == "三南") {
      var tmp_score: any[] = [];
      var tmp_scores: any[] = [];
      for (var j = 3; j < values[i].length; j = j + 2) {
        var name = values[i][j];
        var score = Number(values[i][j+1]);
        tmp_score.push({ 'name':name,'score': score })
        tmp_scores.push(score);
        if (!players.includes(name)) {
          players.push(name);
          nan3_scores[name] = { "days": [], "scores": [], "results": [], "pts": [] };
        }
        nan3_scores[name]["days"].push(values[i][0]);
        nan3_scores[name]["scores"].push(score);
      }
      tmp_score.sort((a, b) => - a.score + b.score);
      var unique_result = Array.from(new Set(tmp_scores)).length;
      if (unique_result == 3){ // 同着無し
        for (var k = 0; k < tmp_score.length; k++){
          nan3_scores[tmp_score[k]['name']]['results'].push(k+1);
          var pt = Math.round((rank_pt3[k]+(tmp_score[k]['score']-back_pt)*0.001)*10)/10;
          nan3_scores[tmp_score[k]['name']]['pts'].push(pt);
        }
      } else if (unique_result == 2){ // 2名同着
        if (tmp_score[0]['score'] == tmp_score[1]['score']){ // 同点1着
          nan3_scores[tmp_score[0]['name']]['results'].push(1);
          nan3_scores[tmp_score[1]['name']]['results'].push(1);
          nan3_scores[tmp_score[2]['name']]['results'].push(3);
          var pt = Math.round(((rank_pt3[0]+rank_pt3[1])/2+(tmp_score[0]['score']-back_pt)*0.001)*10)/10;
          nan3_scores[tmp_score[0]['name']]['pts'].push(pt);
          nan3_scores[tmp_score[1]['name']]['pts'].push(pt);
          var pt = Math.round((rank_pt3[2]+(tmp_score[2]['score']-back_pt)*0.001)*10)/10;
          nan3_scores[tmp_score[2]['name']]['pts'].push(pt);

        } else { // 同点2着
          nan3_scores[tmp_score[0]['name']]['results'].push(1);
          nan3_scores[tmp_score[1]['name']]['results'].push(2);
          nan3_scores[tmp_score[2]['name']]['results'].push(2);
          var pt = Math.round((rank_pt3[0]+(tmp_score[0]['score']-back_pt)*0.001)*10)/10;
          nan3_scores[tmp_score[0]['name']]['pts'].push(pt);
          var pt = Math.round(((rank_pt3[1]+rank_pt3[2])/2+(tmp_score[1]['score']-back_pt)*0.001)*10)/10;
          nan3_scores[tmp_score[1]['name']]['pts'].push(pt);
          nan3_scores[tmp_score[2]['name']]['pts'].push(pt);
        }
      } else { // 同点3着
        for (var k = 0; k < tmp_score.length; k++){
          nan3_scores[tmp_score[k]['name']]['results'].push(1);
          var pt = Math.round(((rank_pt3[0]+rank_pt3[1]+rank_pt3[2])/3+(tmp_score[0]['score']-back_pt)*0.001)*10)/10;
          nan3_scores[tmp_score[k]['name']]['pts'].push(pt);
        }
      };
    }
  }
  // 値算出
  var grid = {};
  grid['columns'] = ['プレーヤー', '試合数', '累計ポイント', '平着', '1位', '2位', '3位', 'トップ率', 'ラス回避率', 'ベストスコア', 'ワーストスコア', '飛び率', '連勝数'];
  grid['data'] = [];
  for (var i = 0; i < Object.keys(nan3_scores).length; i++) {
    name = Object.keys(nan3_scores)[i];
    var num_games = nan3_scores[name]["days"].length;
    var total_point = Math.round((nan3_scores[name]["pts"].reduce((a, b) => { return a + b; }))*10)/10;
    var mean_rank = Math.round((nan3_scores[name]["results"].reduce((a, b) => { return a + b; })/num_games)*100)/100;
    var top = nan3_scores[name]["results"].filter(value => value == 1).length;
    var second = nan3_scores[name]["results"].filter(value => value == 2).length;
    var third = nan3_scores[name]["results"].filter(value => value == 3).length;
    var top_rate = Math.round((top/num_games)*100)/100;
    var las_evasion_rate = Math.round(((top+second)/num_games)*100)/100;
    var best_score = Math.max(...nan3_scores[name]['scores']);
    var worst_score = Math.min(...nan3_scores[name]['scores']);
    var minus_rate = Math.round(((nan3_scores[name]['scores'].filter(value => value < 0).length)/num_games)*100)/100;
    var tmp_winning = 0;
    var winning = 0;
    for (var j = 0; j < nan3_scores[name]["results"].length; j++) {
      if (nan3_scores[name]["results"][j]==1){
        tmp_winning += 1;
      } else {
        tmp_winning = 0;
      }
      if (tmp_winning>winning){
        winning = tmp_winning;
      }
    }
    grid['data'].push([name, num_games, total_point, mean_rank, top, second, third, top_rate, las_evasion_rate, best_score, worst_score, minus_rate, winning])
  }

  if (req.method === "GET" && pathname === "/line-chart") {
    let datasets: any[] = [];
    for (var i = 0; i < Object.keys(nan3_scores).length; i++) {
      var label = Object.keys(nan3_scores)[i];
      var data = nan3_scores[label]["scores"];
      var borderWidth = 1;
      var dataset = { label, data, borderWidth };
      datasets.push(dataset);
    }
    return Response.json({
      type: "line",
      data: {
        labels: dates,
        datasets,
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  if (req.method === "GET" && pathname === "/table") {
    grid['search'] = true;
    grid['sort'] = true;
    grid['pagination'] = {limit: 5};
    return Response.json(grid);
  }

  return serveDir(req, {
    fsRoot: "public",
    urlRoot: "",
    showDirListing: true,
    enableCors: true
  });
});
