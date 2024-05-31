// deno run --watch --allow-net --allow-read --allow-env server.ts
import { serveDir } from "https://deno.land/std@0.151.0/http/file_server.ts";
import { calc_scores } from "./calc_scores.ts";

const rank_pt3 = [40, 0, -25];
const back_pt3 = 40000;
const rank_pt4 = [50, 10, -10, -30];
const back_pt4 = 30000;

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

  function add_rank_pt_to_tmp_score(tmp_score, rank_pt, back_pt){
    var rank = 1;
    var checked = 0;
    for (var k = 0; k < tmp_score.length; k++){
      if (checked > k ){
        continue
      }
      var pts = Math.round(
        (rank_pt[rank-1] + (tmp_score[k]["score"] - back_pt) * 0.001) *
          10,
      ) / 10;
      var same_rank = 1;
      for (var l = k+1; l < tmp_score.length; l++){
        if (tmp_score[k]["score"]  == tmp_score[l]["score"] ){
          var pt = Math.round(
            (rank_pt[rank-1+l-k] + (tmp_score[l]["score"] - back_pt) * 0.001) *
              10,
          ) / 10;
          pts += pt;
          same_rank+=1
        }else{
          break
        }
      }
      for (var m = k; m < k+same_rank; m++){
        tmp_score[m]["rank"] = rank;
        tmp_score[m]["pt"] = Math.round(pts/same_rank*10)/10;
      }
      checked += same_rank;
      rank += same_rank;
    }
    return tmp_score
  }

  // 個人スコアまとめ
  function generate_nan_scores(first_d, last_d, mode, mode2) {
    var first_day = new Date(first_d);
    var last_day = new Date(last_d);
    var nan_scores: { [key: string]: any } = {};
    var players: string[] = [];
    if (mode == "sanma") {
      var mode_key = "三南";
      if (mode2 == "ton") { mode_key = "三東" }
      for (var i = 1; i < values.length; i++) {
        if (values[i][2] == mode_key) {
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
                "kazes": [],
              };
            }
            nan_scores[name]["days"].push(values[i][0]);
            nan_scores[name]["scores"].push(score);
          }

          for (var j = 0; j < 3; j++){
            tmp_score3[j]["kaze"] = j;
          }
          tmp_score3.sort((a, b) => -a.score + b.score);
          tmp_score3 = add_rank_pt_to_tmp_score(tmp_score3, rank_pt3, back_pt3)

          for (var k = 0; k < tmp_score3.length; k++) {
            nan_scores[tmp_score3[k]["name"]]["results"].push(tmp_score3[k]["rank"]);
            nan_scores[tmp_score3[k]["name"]]["pts"].push(tmp_score3[k]["pt"]);
            nan_scores[tmp_score3[k]["name"]]["kazes"].push(tmp_score3[k]["kaze"]);
          }
        }
      }
    } else {
      var mode_key = "四南";
      if (mode2 == "ton") { mode_key = "四東" }
      for (var i = 1; i < values.length; i++) {
        if (values[i][2] == mode_key) {
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
                "kazes": []
              };
            }
            nan_scores[name]["days"].push(values[i][0]);
            nan_scores[name]["scores"].push(score);
          }
          for (var j = 0; j < 4; j++){
            tmp_score4[j]["kaze"] = j;
          }
          console.log(tmp_score4)
          tmp_score4.sort((a, b) => -a.score + b.score);
          tmp_score4 = add_rank_pt_to_tmp_score(tmp_score4, rank_pt4, back_pt4)

          for (var k = 0; k < tmp_score4.length; k++) {
            nan_scores[tmp_score4[k]["name"]]["results"].push(tmp_score4[k]["rank"]);
            nan_scores[tmp_score4[k]["name"]]["pts"].push(tmp_score4[k]["pt"]);
            nan_scores[tmp_score4[k]["name"]]["kazes"].push(tmp_score4[k]["kaze"]);
          }
        }
      }
    }
    return nan_scores;
  }

  function generate_info(nan_scores, mode) {
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
      { title: "累計ポイント", field: "total_point", sorter: "number" },
      { title: "平均着順", field: "mean_rank" },
      { title: "トップ率", field: "top_rate" },
      { title: "ラス回避率", field: "las_evasion_rate" },
      { title: "原点確保率", field: "os_rate" },
      { title: "ベストスコア", field: "best_score" },
      { title: "ワーストスコア", field: "worst_score" },
      { title: "箱下率", field: "minus_rate" },
      { title: "連勝数", field: "winning" },
      { title: "試合数", field: "num_games" },
      { title: "東家一着率", field: "ton_top_rate" },
      { title: "南家一着率", field: "nan_top_rate" },
      { title: "西家一着率", field: "sha_top_rate" },
    ];
    if (mode == "yonma"){
      grid["columns"].push({ title: "北家一着率", field: "pei_top_rate" });
    }
    grid["data"] = [];
    var datas = calc_scores( nan_scores , mode, back_pt3, back_pt4)
    for (var i = 0; i < datas.length; i++) {
      var name_link =
        `<a class="name_link" href="player.html?name=${datas[i]["name"]}" target="_blank"  rel="noopener noreferrer">${datas[i]["name"]}</a>`;
        datas[i]["name"] = name_link;
      grid["data"].push(datas[i]);
    }
    return grid;
  }

  if (req.method === "POST" && pathname === "/line-chart") {
    var requestJson = await req.json();
    var nan_scores = generate_nan_scores(
      requestJson.first_date,
      requestJson.last_date,
      requestJson.mode,
      requestJson.mode2,
    );
    let datasets: any[] = [];
    let days_all = [];
    for (var i = 0; i < Object.keys(nan_scores).length; i++) {
      var label = Object.keys(nan_scores)[i];
      var days = nan_scores[label]["days"];
      days_all = days_all.concat(days);
    }
    days_all = Array.from(new Set(days_all));
    days_all.sort();

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
    var nan_scores = generate_nan_scores(
      requestJson.first_date,
      requestJson.last_date,
      requestJson.mode,
      requestJson.mode2,
    );
    var info = generate_info(nan_scores, requestJson.mode);
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
  if (req.method === "POST" && pathname === "/myrank") {
    var name = await req.json();
    name = name["name"];
    return new Response(name);
  }

  if (req.method === "GET" && pathname === "/get_start_date") {
    // return new Response(uniqueDates[0].replace(/\//g, "-"));
    return new Response("2024/05/01");
  }

  return serveDir(req, {
    fsRoot: "public",
    urlRoot: "",
    showDirListing: true,
    enableCors: true,
  });
});
