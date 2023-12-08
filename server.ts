// deno run --watch --allow-net --allow-read server.ts
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
  const back_pt3 = 40000;
  const rank_pt4 = [50, 10, -10, -30];
  const back_pt4 = 30000;
  var nan3_scores: { [key: string]: any } = {};
  var nan4_scores: { [key: string]: any } = {};
  var players3: string[] = [];
  var players4: string[] = [];
  for (var i = 1; i < values.length; i++) {
    if (values[i][2] == "三南") {
      var tmp_score3: any[] = [];
      var tmp_scores3: any[] = [];
      for (var j = 3; j < values[i].length; j = j + 2) {
        var name = values[i][j];
        var score = Number(values[i][j+1]);
        tmp_score3.push({ 'name':name,'score': score })
        tmp_scores3.push(score);
        if (!players3.includes(name)) {
          players3.push(name);
          nan3_scores[name] = { "days": [], "scores": [], "results": [], "pts": [] };
        }
        nan3_scores[name]["days"].push(values[i][0]);
        nan3_scores[name]["scores"].push(score);
      }
      tmp_score3.sort((a, b) => - a.score + b.score);
      var unique_result = Array.from(new Set(tmp_scores3)).length;
      if (unique_result == 3){ // 同着無し
        for (var k = 0; k < tmp_score3.length; k++){
          nan3_scores[tmp_score3[k]['name']]['results'].push(k+1);
          var pt = Math.round((rank_pt3[k]+(tmp_score3[k]['score']-back_pt3)*0.001)*10)/10;
          nan3_scores[tmp_score3[k]['name']]['pts'].push(pt);
        }
      } else if (unique_result == 2){ // 2名同着
        if (tmp_score3[0]['score'] == tmp_score3[1]['score']){ // 同点1着
          nan3_scores[tmp_score3[0]['name']]['results'].push(1);
          nan3_scores[tmp_score3[1]['name']]['results'].push(1);
          nan3_scores[tmp_score3[2]['name']]['results'].push(3);
          var pt = Math.round(((rank_pt3[0]+rank_pt3[1])/2+(tmp_score3[0]['score']-back_pt3)*0.001)*10)/10;
          nan3_scores[tmp_score3[0]['name']]['pts'].push(pt);
          nan3_scores[tmp_score3[1]['name']]['pts'].push(pt);
          var pt = Math.round((rank_pt3[2]+(tmp_score3[2]['score']-back_pt3)*0.001)*10)/10;
          nan3_scores[tmp_score3[2]['name']]['pts'].push(pt);

        } else { // 同点2着
          nan3_scores[tmp_score3[0]['name']]['results'].push(1);
          nan3_scores[tmp_score3[1]['name']]['results'].push(2);
          nan3_scores[tmp_score3[2]['name']]['results'].push(2);
          var pt = Math.round((rank_pt3[0]+(tmp_score3[0]['score']-back_pt3)*0.001)*10)/10;
          nan3_scores[tmp_score3[0]['name']]['pts'].push(pt);
          var pt = Math.round(((rank_pt3[1]+rank_pt3[2])/2+(tmp_score3[1]['score']-back_pt3)*0.001)*10)/10;
          nan3_scores[tmp_score3[1]['name']]['pts'].push(pt);
          nan3_scores[tmp_score3[2]['name']]['pts'].push(pt);
        }
      } else { // 同点3着
        for (var k = 0; k < tmp_score3.length; k++){
          nan3_scores[tmp_score3[k]['name']]['results'].push(1);
          var pt = Math.round(((rank_pt3[0]+rank_pt3[1]+rank_pt3[2])/3+(tmp_score3[0]['score']-back_pt3)*0.001)*10)/10;
          nan3_scores[tmp_score3[k]['name']]['pts'].push(pt);
        }
      };
    } else if (values[i][2] == "四南") {
      var tmp_score4: any[] = [];
      var tmp_scores4: any[] = [];
      for (var j = 3; j < values[i].length; j = j + 2) {
        var name = values[i][j];
        var score = Number(values[i][j+1]);
        tmp_score4.push({ 'name':name,'score': score })
        tmp_scores4.push(score);
        if (!players4.includes(name)) {
          players4.push(name);
          nan4_scores[name] = { "days": [], "scores": [], "results": [], "pts": [] };
        }
        nan4_scores[name]["days"].push(values[i][0]);
        nan4_scores[name]["scores"].push(score);
      }
      tmp_score4.sort((a, b) => - a.score + b.score);
      var unique_result = Array.from(new Set(tmp_scores4)).length;
      if (unique_result == 4){ // 同着無し
        for (var k = 0; k < tmp_score4.length; k++){
          nan4_scores[tmp_score4[k]['name']]['results'].push(k+1);
          var pt = Math.round((rank_pt4[k]+(tmp_score4[k]['score']-back_pt4)*0.001)*10)/10;
          nan4_scores[tmp_score4[k]['name']]['pts'].push(pt);
        }
      } else if (unique_result == 3){ // 2名同着
        if (tmp_score4[0]['score'] == tmp_score4[1]['score']) { // 同点1着
          nan4_scores[tmp_score4[0]['name']]['results'].push(1);
          nan4_scores[tmp_score4[1]['name']]['results'].push(1);
          nan4_scores[tmp_score4[2]['name']]['results'].push(3);
          nan4_scores[tmp_score4[3]['name']]['results'].push(4);
          var pt = Math.round(((rank_pt4[0]+rank_pt4[1])/2+(tmp_score4[0]['score']-back_pt4)*0.001)*10)/10;
          nan4_scores[tmp_score4[0]['name']]['pts'].push(pt);
          nan4_scores[tmp_score4[1]['name']]['pts'].push(pt);
          var pt = Math.round((rank_pt4[2]+(tmp_score4[2]['score']-back_pt4)*0.001)*10)/10;
          nan4_scores[tmp_score4[2]['name']]['pts'].push(pt);
          var pt = Math.round((rank_pt4[3]+(tmp_score4[3]['score']-back_pt4)*0.001)*10)/10;
          nan4_scores[tmp_score4[3]['name']]['pts'].push(pt);
        } else if (tmp_score4[1]['score'] == tmp_score4[2]['score']) { // 同点2着
          nan4_scores[tmp_score4[0]['name']]['results'].push(1);
          nan4_scores[tmp_score4[1]['name']]['results'].push(2);
          nan4_scores[tmp_score4[2]['name']]['results'].push(2);
          nan4_scores[tmp_score4[3]['name']]['results'].push(4);
          var pt = Math.round((rank_pt4[0]+(tmp_score4[0]['score']-back_pt4)*0.001)*10)/10;
          nan4_scores[tmp_score4[0]['name']]['pts'].push(pt);
          var pt = Math.round(((rank_pt4[1]+rank_pt4[2])/2+(tmp_score4[1]['score']-back_pt4)*0.001)*10)/10;
          nan4_scores[tmp_score4[1]['name']]['pts'].push(pt);
          nan4_scores[tmp_score4[2]['name']]['pts'].push(pt);
          var pt = Math.round((rank_pt4[3]+(tmp_score4[3]['score']-back_pt4)*0.001)*10)/10;
          nan4_scores[tmp_score4[3]['name']]['pts'].push(pt);
        } else { // 同点3着
          nan4_scores[tmp_score4[0]['name']]['results'].push(1);
          nan4_scores[tmp_score4[1]['name']]['results'].push(2);
          nan4_scores[tmp_score4[2]['name']]['results'].push(3);
          nan4_scores[tmp_score4[3]['name']]['results'].push(3);
          var pt = Math.round((rank_pt4[0]+(tmp_score4[0]['score']-back_pt4)*0.001)*10)/10;
          nan4_scores[tmp_score4[0]['name']]['pts'].push(pt);
          var pt = Math.round((rank_pt4[1]+(tmp_score4[1]['score']-back_pt4)*0.001)*10)/10;
          nan4_scores[tmp_score4[1]['name']]['pts'].push(pt);
          var pt = Math.round(((rank_pt4[2]+rank_pt4[3])/2+(tmp_score4[2]['score']-back_pt4)*0.001)*10)/10;
          nan4_scores[tmp_score4[2]['name']]['pts'].push(pt);
          nan4_scores[tmp_score4[3]['name']]['pts'].push(pt);
        }
      } else if (unique_result == 2){ // 3名同着
        if (tmp_score4[0]['score'] == tmp_score4[1]['score'] == tmp_score4[2]['score']){ // 上位3名同着
          nan4_scores[tmp_score4[0]['name']]['results'].push(1);
          nan4_scores[tmp_score4[1]['name']]['results'].push(1);
          nan4_scores[tmp_score4[2]['name']]['results'].push(1);
          nan4_scores[tmp_score4[3]['name']]['results'].push(4);
          var pt = Math.round(((rank_pt4[0]+rank_pt4[1]+rank_pt4[2])/3+(tmp_score4[0]['score']-back_pt4)*0.001)*10)/10;
          nan4_scores[tmp_score4[0]['name']]['pts'].push(pt);
          nan4_scores[tmp_score4[1]['name']]['pts'].push(pt);
          nan4_scores[tmp_score4[2]['name']]['pts'].push(pt);
          var pt = Math.round((rank_pt4[3]+(tmp_score4[3]['score']-back_pt4)*0.001)*10)/10;
          nan4_scores[tmp_score4[3]['name']]['pts'].push(pt);
        }else{ // 下位3名同着
          nan4_scores[tmp_score4[0]['name']]['results'].push(1);
          nan4_scores[tmp_score4[1]['name']]['results'].push(2);
          nan4_scores[tmp_score4[2]['name']]['results'].push(2);
          nan4_scores[tmp_score4[3]['name']]['results'].push(2);
          var pt = Math.round((rank_pt4[0]+(tmp_score4[0]['score']-back_pt4)*0.001)*10)/10;
          nan4_scores[tmp_score4[0]['name']]['pts'].push(pt);
          var pt = Math.round(((rank_pt4[1]+rank_pt4[2]+rank_pt4[3])/3+(tmp_score4[1]['score']-back_pt4)*0.001)*10)/10;
          nan4_scores[tmp_score4[1]['name']]['pts'].push(pt);
          nan4_scores[tmp_score4[2]['name']]['pts'].push(pt);
          nan4_scores[tmp_score4[3]['name']]['pts'].push(pt);
        }
      } else { // 同点4着
        for (var k = 0; k < tmp_score4.length; k++){
          nan4_scores[tmp_score4[k]['name']]['results'].push(1);
          var pt = Math.round(((rank_pt4[0]+rank_pt4[1]+rank_pt4[2]+rank_pt4[3])/4+(tmp_score4[0]['score']-back_pt4)*0.001)*10)/10;
          nan4_scores[tmp_score4[k]['name']]['pts'].push(pt);
        }
      };
    }
  }



  function generate_info(nan_scores){
    var grid = {};
    grid['columns'] = ['プレーヤー', '試合数', '累計ポイント', '平着', '1位', '2位', '3位', 'トップ率', 'ラス回避率', 'ベストスコア', 'ワーストスコア', '飛び率', '連勝数'];
    grid['data'] = [];
    for (var i = 0; i < Object.keys(nan_scores).length; i++) {
      name = Object.keys(nan_scores)[i];
      var num_games = nan_scores[name]["days"].length;
      var total_point = Math.round((nan_scores[name]["pts"].reduce((a, b) => { return a + b; }))*10)/10;
      var mean_rank = Math.round((nan_scores[name]["results"].reduce((a, b) => { return a + b; })/num_games)*100)/100;
      var top = nan_scores[name]["results"].filter(value => value == 1).length;
      var second = nan_scores[name]["results"].filter(value => value == 2).length;
      var third = nan_scores[name]["results"].filter(value => value == 3).length;
      var top_rate = Math.round((top/num_games)*100)/100;
      var las_evasion_rate = Math.round(((top+second)/num_games)*100)/100;
      var best_score = Math.max(...nan_scores[name]['scores']);
      var worst_score = Math.min(...nan_scores[name]['scores']);
      var minus_rate = Math.round(((nan_scores[name]['scores'].filter(value => value < 0).length)/num_games)*100)/100;
      var tmp_winning = 0;
      var winning = 0;
      for (var j = 0; j < nan_scores[name]["results"].length; j++) {
        if (nan_scores[name]["results"][j]==1){
          tmp_winning += 1;
        } else {
          tmp_winning = 0;
        }
        if (tmp_winning>winning){
          winning = tmp_winning;
        }
      }
      grid['data'].push([name, num_games, total_point, mean_rank, top, second, third, top_rate, las_evasion_rate, best_score, worst_score, minus_rate, winning]);
    }
    return grid;
  }


  var info3 = generate_info(nan3_scores);
  var info4 = generate_info(nan4_scores);

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
    var grid = info3;
    grid['search'] = true;
    grid['sort'] = true;
    grid['pagination'] = {limit: 5};
    return Response.json(grid);
  }

  // 個人ページ
  if (req.method === "POST" && pathname === "/myrank") {
    var requestJson = await req.json();
    var name = requestJson['name'];
    for (var i = 0; i < Object.keys(nan3_scores).length; i++){
      if (name == Object.keys(nan3_scores)[i]){
        console.log(nan3_scores[name]);
      }
    }
    return new Response("");
  }
  return serveDir(req, {
    fsRoot: "public",
    urlRoot: "",
    showDirListing: true,
    enableCors: true
  });
});
