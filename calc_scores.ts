function calc_scores(nan_scores, mode, back_pt3, back_pt4) {
    console.log(nan_scores);
    var results:any[] = [];
    for (var i = 0; i < Object.keys(nan_scores).length; i++) {

        var name = Object.keys(nan_scores)[i];
        
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
        if (mode == "sanma") {
            var last = nan_scores[name]["results"].filter((value) =>
                value == 3
            ).length;
        } else {
            var last =
                nan_scores[name]["results"].filter((value) => value == 4).length;
        }
        var top_rate = Math.round((top / num_games) * 100) / 100;


        var las_evasion_rate =
            Math.round(((num_games - last) / num_games) * 100) /
            100;

        var os_rate = 0;
        if (mode == "sanma") {
            var back_score = back_pt3;
        } else {
            var back_score = back_pt4;
        }
        for (var j = 0; j < nan_scores[name]["scores"].length; j++) {
            if (nan_scores[name]["scores"][j] >= back_score) {
                os_rate += 1;
            }
        }
        os_rate = Math.round((os_rate / nan_scores[name]["scores"].length) * 100) / 100;

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

        var kaze_top_rates: number[] = [];
        var kaze_num = 4;
        if (mode == "sanma") {
            kaze_num = 3;
        }
        var kazes = ["東", "南", "西", "北"];
        for (var j = 0; j < kaze_num+1; j++){
            var win_count = 0
            var kaze_count = 0;
            for (var k = 0; k < nan_scores[name]["kazes"].length; k++){
                if (nan_scores[name]["kazes"][k] == j ){
                    kaze_count += 1;
                    if (nan_scores[name]["results"][k] == 1){
                        win_count += 1;
                    }
                }
            }
            var kaze_top_rate = Math.round(win_count/kaze_count*100)/100;
            kaze_top_rates.push(kaze_top_rate);
        }

        var ton_top_rate = kaze_top_rates[0];
        var nan_top_rate = kaze_top_rates[1];
        var sha_top_rate = kaze_top_rates[2];
        var result = {
            name,
            num_games,
            total_point,
            mean_rank,
            top_rate,
            las_evasion_rate,
            os_rate,
            best_score,
            worst_score,
            minus_rate,
            winning,
            ton_top_rate,
            nan_top_rate,
            sha_top_rate
        };
        if (mode == 'yonma'){
            result["pei_top_rate"] = kaze_top_rates[3];
        }
        results.push(result);
    }
    return results;
}

export { calc_scores };