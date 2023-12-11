// deno run --watch --allow-net --allow-read --allow-env server.ts
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
        dates[j - 1] = values[j][0];
        counter += 1;
      }
    }
  }


  // 個人スコアまとめ
  function generate_nan_scores(first_d, last_d, mode) {
    var first_day = new Date(first_d);
    var last_day = new Date(last_d);
    const rank_pt3 = [40, 0, -25];
    const back_pt3 = 40000;
    const rank_pt4 = [50, 10, -10, -30];
    const back_pt4 = 30000;
    var nan_scores: { [key: string]: any } = {};
    var players: string[] = [];
    if (mode == "sanma"){
      for (var i = 1; i < values.length; i++) {
        if (values[i][2] == "三南") {
          var tmp_score3: any[] = [];
          var tmp_scores3: any[] = [];
          for (var j = 3; j < values[i].length; j = j + 2) {
            if (
              first_day > new Date(values[i][0].substring(0, 10)) ||
              new Date(values[i][0].substring(0, 10)) > last_day
            ) {
              continue;
            }
            var name = values[i][j];
            var score = Number(values[i][j + 1]);
            tmp_score3.push({ "name": name, "score": score });
            tmp_scores3.push(score);
            if (!players.includes(name)) {
              players.push(name);
              nan_scores[name] = {
                "days": [],
                "scores": [],
                "results": [],
                "pts": [],
              };
            }
            nan_scores[name]["days"].push(values[i][0]);
            nan_scores[name]["scores"].push(score);
          }
          tmp_score3.sort((a, b) => -a.score + b.score);
          var unique_result = Array.from(new Set(tmp_scores3)).length;
          if (unique_result == 3) { // 同着無し
            for (var k = 0; k < tmp_score3.length; k++) {
              nan_scores[tmp_score3[k]["name"]]["results"].push(k + 1);
              var pt = Math.round(
                (rank_pt3[k] + (tmp_score3[k]["score"] - back_pt3) * 0.001) * 10,
              ) / 10;
              nan_scores[tmp_score3[k]["name"]]["pts"].push(pt);
            }
          } else if (unique_result == 2) { // 2名同着
            if (tmp_score3[0]["score"] == tmp_score3[1]["score"]) { // 同点1着
              nan_scores[tmp_score3[0]["name"]]["results"].push(1);
              nan_scores[tmp_score3[1]["name"]]["results"].push(1);
              nan_scores[tmp_score3[2]["name"]]["results"].push(3);
              var pt = Math.round(
                ((rank_pt3[0] + rank_pt3[1]) / 2 +
                  (tmp_score3[0]["score"] - back_pt3) * 0.001) * 10,
              ) / 10;
              nan_scores[tmp_score3[0]["name"]]["pts"].push(pt);
              nan_scores[tmp_score3[1]["name"]]["pts"].push(pt);
              var pt = Math.round(
                (rank_pt3[2] + (tmp_score3[2]["score"] - back_pt3) * 0.001) * 10,
              ) / 10;
              nan_scores[tmp_score3[2]["name"]]["pts"].push(pt);
            } else { // 同点2着
              nan_scores[tmp_score3[0]["name"]]["results"].push(1);
              nan_scores[tmp_score3[1]["name"]]["results"].push(2);
              nan_scores[tmp_score3[2]["name"]]["results"].push(2);
              var pt = Math.round(
                (rank_pt3[0] + (tmp_score3[0]["score"] - back_pt3) * 0.001) * 10,
              ) / 10;
              nan_scores[tmp_score3[0]["name"]]["pts"].push(pt);
              var pt = Math.round(
                ((rank_pt3[1] + rank_pt3[2]) / 2 +
                  (tmp_score3[1]["score"] - back_pt3) * 0.001) * 10,
              ) / 10;
              nan_scores[tmp_score3[1]["name"]]["pts"].push(pt);
              nan_scores[tmp_score3[2]["name"]]["pts"].push(pt);
            }
          } else { // 同点3着
            for (var k = 0; k < tmp_score3.length; k++) {
              nan_scores[tmp_score3[k]["name"]]["results"].push(1);
              var pt = Math.round(
                ((rank_pt3[0] + rank_pt3[1] + rank_pt3[2]) / 3 +
                  (tmp_score3[0]["score"] - back_pt3) * 0.001) * 10,
              ) / 10;
              nan_scores[tmp_score3[k]["name"]]["pts"].push(pt);
            }
          }
        }
      }
    } else {
      for (var i = 1; i < values.length; i++) {
        if (values[i][2] == "四南") {
          var tmp_score4: any[] = [];
          var tmp_scores4: any[] = [];
          for (var j = 3; j < values[i].length; j = j + 2) {
            if (
              first_day > new Date(values[i][0].substring(0, 10)) ||
              new Date(values[i][0].substring(0, 10)) > last_day
            ) {
              continue;
            }
            var name = values[i][j];
            var score = Number(values[i][j + 1]);
            tmp_score4.push({ "name": name, "score": score });
            tmp_scores4.push(score);
            if (!players.includes(name)) {
              players.push(name);
              nan_scores[name] = {
                "days": [],
                "scores": [],
                "results": [],
                "pts": [],
              };
            }
            nan_scores[name]["days"].push(values[i][0]);
            nan_scores[name]["scores"].push(score);
          }
          tmp_score4.sort((a, b) => -a.score + b.score);
          var unique_result = Array.from(new Set(tmp_scores4)).length;
          if (unique_result == 4) { // 同着無し
            for (var k = 0; k < tmp_score4.length; k++) {
              nan_scores[tmp_score4[k]["name"]]["results"].push(k + 1);
              var pt = Math.round(
                (rank_pt4[k] + (tmp_score4[k]["score"] - back_pt4) * 0.001) * 10,
              ) / 10;
              nan_scores[tmp_score4[k]["name"]]["pts"].push(pt);
            }
          } else if (unique_result == 3) { // 2名同着
            if (tmp_score4[0]["score"] == tmp_score4[1]["score"]) { // 同点1着
              nan_scores[tmp_score4[0]["name"]]["results"].push(1);
              nan_scores[tmp_score4[1]["name"]]["results"].push(1);
              nan_scores[tmp_score4[2]["name"]]["results"].push(3);
              nan_scores[tmp_score4[3]["name"]]["results"].push(4);
              var pt = Math.round(
                ((rank_pt4[0] + rank_pt4[1]) / 2 +
                  (tmp_score4[0]["score"] - back_pt4) * 0.001) * 10,
              ) / 10;
              nan_scores[tmp_score4[0]["name"]]["pts"].push(pt);
              nan_scores[tmp_score4[1]["name"]]["pts"].push(pt);
              var pt = Math.round(
                (rank_pt4[2] + (tmp_score4[2]["score"] - back_pt4) * 0.001) * 10,
              ) / 10;
              nan_scores[tmp_score4[2]["name"]]["pts"].push(pt);
              var pt = Math.round(
                (rank_pt4[3] + (tmp_score4[3]["score"] - back_pt4) * 0.001) * 10,
              ) / 10;
              nan_scores[tmp_score4[3]["name"]]["pts"].push(pt);
            } else if (tmp_score4[1]["score"] == tmp_score4[2]["score"]) { // 同点2着
              nan_scores[tmp_score4[0]["name"]]["results"].push(1);
              nan_scores[tmp_score4[1]["name"]]["results"].push(2);
              nan_scores[tmp_score4[2]["name"]]["results"].push(2);
              nan_scores[tmp_score4[3]["name"]]["results"].push(4);
              var pt = Math.round(
                (rank_pt4[0] + (tmp_score4[0]["score"] - back_pt4) * 0.001) * 10,
              ) / 10;
              nan_scores[tmp_score4[0]["name"]]["pts"].push(pt);
              var pt = Math.round(
                ((rank_pt4[1] + rank_pt4[2]) / 2 +
                  (tmp_score4[1]["score"] - back_pt4) * 0.001) * 10,
              ) / 10;
              nan_scores[tmp_score4[1]["name"]]["pts"].push(pt);
              nan_scores[tmp_score4[2]["name"]]["pts"].push(pt);
              var pt = Math.round(
                (rank_pt4[3] + (tmp_score4[3]["score"] - back_pt4) * 0.001) * 10,
              ) / 10;
              nan_scores[tmp_score4[3]["name"]]["pts"].push(pt);
            } else { // 同点3着
              nan_scores[tmp_score4[0]["name"]]["results"].push(1);
              nan_scores[tmp_score4[1]["name"]]["results"].push(2);
              nan_scores[tmp_score4[2]["name"]]["results"].push(3);
              nan_scores[tmp_score4[3]["name"]]["results"].push(3);
              var pt = Math.round(
                (rank_pt4[0] + (tmp_score4[0]["score"] - back_pt4) * 0.001) * 10,
              ) / 10;
              nan_scores[tmp_score4[0]["name"]]["pts"].push(pt);
              var pt = Math.round(
                (rank_pt4[1] + (tmp_score4[1]["score"] - back_pt4) * 0.001) * 10,
              ) / 10;
              nan_scores[tmp_score4[1]["name"]]["pts"].push(pt);
              var pt = Math.round(
                ((rank_pt4[2] + rank_pt4[3]) / 2 +
                  (tmp_score4[2]["score"] - back_pt4) * 0.001) * 10,
              ) / 10;
              nan_scores[tmp_score4[2]["name"]]["pts"].push(pt);
              nan_scores[tmp_score4[3]["name"]]["pts"].push(pt);
            }
          } else if (unique_result == 2) { // 3名同着
            if (
              tmp_score4[0]["score"] == tmp_score4[1]["score"] ==
                tmp_score4[2]["score"]
            ) { // 上位3名同着
              nan_scores[tmp_score4[0]["name"]]["results"].push(1);
              nan_scores[tmp_score4[1]["name"]]["results"].push(1);
              nan_scores[tmp_score4[2]["name"]]["results"].push(1);
              nan_scores[tmp_score4[3]["name"]]["results"].push(4);
              var pt = Math.round(
                ((rank_pt4[0] + rank_pt4[1] + rank_pt4[2]) / 3 +
                  (tmp_score4[0]["score"] - back_pt4) * 0.001) * 10,
              ) / 10;
              nan_scores[tmp_score4[0]["name"]]["pts"].push(pt);
              nan_scores[tmp_score4[1]["name"]]["pts"].push(pt);
              nan_scores[tmp_score4[2]["name"]]["pts"].push(pt);
              var pt = Math.round(
                (rank_pt4[3] + (tmp_score4[3]["score"] - back_pt4) * 0.001) * 10,
              ) / 10;
              nan_scores[tmp_score4[3]["name"]]["pts"].push(pt);
            } else { // 下位3名同着
              nan_scores[tmp_score4[0]["name"]]["results"].push(1);
              nan_scores[tmp_score4[1]["name"]]["results"].push(2);
              nan_scores[tmp_score4[2]["name"]]["results"].push(2);
              nan_scores[tmp_score4[3]["name"]]["results"].push(2);
              var pt = Math.round(
                (rank_pt4[0] + (tmp_score4[0]["score"] - back_pt4) * 0.001) * 10,
              ) / 10;
              nan_scores[tmp_score4[0]["name"]]["pts"].push(pt);
              var pt = Math.round(
                ((rank_pt4[1] + rank_pt4[2] + rank_pt4[3]) / 3 +
                  (tmp_score4[1]["score"] - back_pt4) * 0.001) * 10,
              ) / 10;
              nan_scores[tmp_score4[1]["name"]]["pts"].push(pt);
              nan_scores[tmp_score4[2]["name"]]["pts"].push(pt);
              nan_scores[tmp_score4[3]["name"]]["pts"].push(pt);
            }
          } else { // 同点4着
            for (var k = 0; k < tmp_score4.length; k++) {
              nan_scores[tmp_score4[k]["name"]]["results"].push(1);
              var pt = Math.round(
                ((rank_pt4[0] + rank_pt4[1] + rank_pt4[2] + rank_pt4[3]) / 4 +
                  (tmp_score4[0]["score"] - back_pt4) * 0.001) * 10,
              ) / 10;
              nan_scores[tmp_score4[k]["name"]]["pts"].push(pt);
            }
          }
        }
      }
    }
    return nan_scores;
  }

  function generate_info(nan_scores) {
    var grid = {};
    grid["columns"] = [
      {
        title: "プレーヤー",
        field: "name",
        formatter: "html",
        // formatterParams: {
        //   labelField: "name",
        //   urlPrefix: "player.html?name=",
        //   target: "_blank",
        // },
      },
      { title: "試合数", field: "num_games" },
      { title: "累計ポイント", field: "total_point", sorter: "number" },
      { title: "平均着順", field: "mean_rank" },
      { title: "トップ率", field: "top_rate" },
      { title: "二着率", field: "second_rate" },
      { title: "ラス率", field: "third_rate" },
      { title: "ラス回避率", field: "las_evasion_rate" },
      { title: "ベストスコア", field: "best_score" },
      { title: "ワーストスコア", field: "worst_score" },
      { title: "飛び率", field: "minus_rate" },
      { title: "連勝数", field: "winning" },
    ];
    grid["data"] = [];
    for (var i = 0; i < Object.keys(nan_scores).length; i++) {
      var name = Object.keys(nan_scores)[i];
      var name_link = `<a class="name_link" href="player.html?name=${name}" target="_blank"  rel="noopener noreferrer">${name}</a>`;
      var num_games = nan_scores[name]["days"].length;
      var total_point = Math.round(
        (nan_scores[name]["pts"].reduce((a, b) => {
          return a + b;
        })) * 10,
      ) / 10;
      var mean_rank = Math.round(
        (nan_scores[name]["results"].reduce((a, b) => {
          return a + b;
        }) / num_games) * 100,
      ) / 100;
      var top = nan_scores[name]["results"].filter((value) =>
        value == 1
      ).length;
      var second = nan_scores[name]["results"].filter((value) =>
        value == 2
      ).length;
      var third =
        nan_scores[name]["results"].filter((value) => value == 3).length;
      var top_rate = Math.round((top / num_games) * 100) / 100;
      var second_rate = Math.round((second / num_games) * 100) / 100;
      var third_rate = Math.round((third / num_games) * 100) / 100;
      var las_evasion_rate = Math.round(((top + second) / num_games) * 100) /
        100;
      var best_score = Math.max(...nan_scores[name]["scores"]);
      var worst_score = Math.min(...nan_scores[name]["scores"]);
      var minus_rate = Math.round(
        ((nan_scores[name]["scores"].filter((value) => value < 0).length) /
          num_games) * 100,
      ) / 100;
      var tmp_winning = 0;
      var winning = 0;
      for (var j = 0; j < nan_scores[name]["results"].length; j++) {
        if (nan_scores[name]["results"][j] == 1) {
          tmp_winning += 1;
        } else {
          tmp_winning = 0;
        }
        if (tmp_winning > winning) {
          winning = tmp_winning;
        }
      }
      grid["data"].push({
        "name": name_link,
        num_games,
        total_point,
        mean_rank,
        top_rate,
        second_rate,
        third_rate,
        las_evasion_rate,
        best_score,
        worst_score,
        minus_rate,
        winning,
      });
    }
    return grid;
  }

  if (req.method === "POST" && pathname === "/line-chart") {
    var requestJson = await req.json();
    var nan_scores = generate_nan_scores(requestJson.first_date, requestJson.last_date, requestJson.mode);
    let datasets: any[] = [];
    let days_all = [];
    for (var i = 0; i < Object.keys(nan_scores).length; i++) {
      var label = Object.keys(nan_scores)[i];
      var days = nan_scores[label]["days"];
      days_all = days_all.concat(days);
    }
    days_all = Array.from(new Set(days_all));

    for (var i = 0; i < Object.keys(nan_scores).length; i++) {
      var label = Object.keys(nan_scores)[i];
      var data: number[] = [];
      var pt_tmp = 0;
      for (var j = 0; j < days_all.length; j++) {
        var day = days_all[j];
        if (nan_scores[label]["days"].includes(day)) {
          var pt: number =
            nan_scores[label]["pts"][nan_scores[label]["days"].indexOf(day)];
          pt_tmp += pt;
          data[j] = pt_tmp;
        } else {
          if (j == days_all.length - 1) {
            data[j] = pt_tmp;
          } else {
            data[j] = NaN;
          }
        }
      }
      var borderWidth = 1;
      var dataset = { label, data, borderWidth };
      datasets.push(dataset);
    }

    return Response.json({
      type: "line",
      data: {
        labels: days_all,
        datasets,
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
        fill: false,
        interaction: {
          intersect: false,
        },
        radius: 0,
      },
    });
  }

  // 表2テスト
  if (req.method === "POST" && pathname === "/table") {
    var requestJson = await req.json();
    var nan_scores = generate_nan_scores(requestJson.first_date, requestJson.last_date, requestJson.mode);
    var info = generate_info(nan_scores);
    var config = {
      layout: "fitColumns", //fit columns to width of table
      // responsiveLayout:"hide",  //hide columns that don't fit on the table
      responsiveLayout: "collapse",
      addRowPos: "top", //when adding a new row, add it to the top of the table
      history: true, //allow undo and redo actions on the table
      pagination: "local", //paginate the data
      paginationSize: 7, //allow 7 rows per page of data
      // paginationCounter:"rows", //display count of paginated rows in footer
      movableColumns: true, //allow column order to be changed
      initialSort: [ //set the initial sort order of the data
        { column: "total_point", dir: "desc" },
      ],
      columnDefaults: {
        tooltip: true, //show tool tips on cells
      },
    };

    info = { ...info, ...config };
    return Response.json(info);
  }

  // 個人ページ
  if (req.method === "POST" && pathname === "/myrank"){
    var name = await req.json();
    name = name["name"];
    return new Response(name)
  }

  if (req.method === "GET" && pathname === "/get_start_date") {
    return new Response(uniqueDates[0].replace(/\//g, "-"));
  }

  return serveDir(req, {
    fsRoot: "public",
    urlRoot: "",
    showDirListing: true,
    enableCors: true,
  });
});
