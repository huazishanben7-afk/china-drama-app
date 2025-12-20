/*--------------------------------------------------------------

	jcom_api.js for API2019
	2025/7/29	更新
	
--------------------------------------------------------------*/
// stage時はapiもstageを参照するための判定
var isStage = (location.hostname.match(/stage-www2/)) ? true : false;
isStage = false; //	ステージも公開APIを参照する　2018/10/15
var isMyjcom = (location.hostname.match(/www2.myjcom.jp/) || location.hostname.match(/myjcom.weska.me/)) ? true : false;
var api_php_path = "/special/common/js/api.php?"; //  2019年版API用
var jsonpCallbackUID = 0;

/*--------------------------------------------------------------
	2019/4/8
	リクエストURLを作成
--------------------------------------------------------------*/
function getAPIRequestQuery(searchObj,flag){
	var query = "";
	for(var key in searchObj){
		var val = searchObj[key];
		if(key == 'query'){
			if(flag){
			val = val.replace(/ /g,'+');
			val = val.replace(/　/g,'+');
			}else{
			val = encodeURIComponent(val);
			}
		}
		if(key != 'keyword') query += "&"+key+"="+val;
	}

	//trace("jcom_api.js query "+query);
	if(!flag){
		return query;//encodeURIComponent(query)
	}else{
		return encodeURIComponent(query);
	}
}


/*--------------------------------------------------------------
	apiの読み込み完了　//　未実装
--------------------------------------------------------------*/
function jcomApiLoaded(str){
	//trace("読み込み完了："+str);
	//	案件毎にoverrideして利用する。
}

/*==============================================
	
	2020/3/19
	ランキングAPI

	//	APIパラメータ
	var searchObj = {
			rankingType:1,	// 必須 ランキング種別：1(リモ録週間)　2(リモ録月間)
			channelType:2,	// 必須 放送波種別：2(地デジ)　3(BS)　120(CATV)　200(コミュチャン)
			genreId:3,	// 任意 ジャンルID：MINDSで定義されている親または子ジャンルIDをいずれか1種を指定可能。
			backNumber:2,	// 任意 過去ランキング
			limit:30,	// 任意 件数：（1〜100）
			areaId:108,	// 任意 エリアID
		};	
		
	//	制御用パラメータ
	var statusObj = {
			uid:0,	//	UID
			serchTxt:['華','中国ドラマ'],//	検索結果からキーワードで絞り込む。独自実装
			container:'.remoroku_ranking_list',		//格納コンテナ（.付きの文字列で指定）デフォルト：.ranking_list　省略可
			noimage:'/special/common/images/no_image_800x448.jpg',		//画像がない場合の代替え画像　省略可
			callback:'searchRankingAPIComplete',	//	コールバック関数 デフォルト：searchProgramAPIComplete　省略可
		};	
		
	//	データ呼び出し
	getJcomRankingList(searchObj,statusObj);
	
==============================================*/

function getJcomRankingList(_searchObj,_statusObj){
	setCurrentTimeForAPI();
	
	var user_area_id = jQuery.cookie("area_id");
	if(user_area_id == undefined){
		user_area_id = 12;
	}
	var searchObj = {};
	var statusObj = {};
	
	// _searchObjからAPI検索用Objを抽出
	
	if(_searchObj.rankingType != null){
		searchObj.rankingType = _searchObj.rankingType;
	}
	if(_searchObj.channelType != null){
		searchObj.channelType = _searchObj.channelType;
	}
	if(_searchObj.genreId != null){
		searchObj.genreId = _searchObj.genreId;
	}
	if(_searchObj.backNumber != null){
		searchObj.backNumber = _searchObj.backNumber;
	}
	if(_searchObj.limit != null){
		searchObj.limit = _searchObj.limit;
	}
	if(_searchObj.areaId != null){
		searchObj.areaId = _searchObj.areaId;
	}

	
	// _statusObjから制御用Objを抽出
	if(_statusObj.uid != null) statusObj.uid = _statusObj.uid;
	if(_statusObj.container != null){
		statusObj.container = _statusObj.container;
	}else{
		statusObj.container = '.ranking_list';
	}
	if(_statusObj.container_parent != null){
		statusObj.container_parent = _statusObj.container_parent;
	}
	if(_statusObj.noimage != null){
		statusObj.noimage = _statusObj.noimage;
	}else{
		statusObj.noimage = '/special/common/images/no_image_800x448.jpg';
	}
	if(_statusObj.callback != null){
		statusObj.callback = _statusObj.callback;
	}else{
		statusObj.callback = "searchRankingAPIComplete";
	}
	if(_statusObj.serchTxt != null){
		statusObj.serchTxt = _statusObj.serchTxt;
	}else{
		statusObj.serchTxt = [];
	}

	// コールバックパラメータ名の指定
	jsonpCallbackUID ++;
	statusObj.jsonpCallback = 'ranking'+jsonpCallbackUID;

	searchJCOMRankingAPI(searchObj,statusObj);
}


//	日付
function formatDateYYYYMMDDhhmmss(str,format){
	var yyyy = str.substr(0,4);
	var mm = str.substr(4,2);
	var dd = str.substr(6,2);
	return yyyy+format[0]+mm+format[1]+dd+format[2];
}
function formatDateYYYYMMDDhhmmss_short(str){
	var yyyy = str.substr(0,4);
	var mm = Number(str.substr(4,2));
	var dd = Number(str.substr(6,2));
	return mm+"/"+dd;
}
function YYYYMMDDhhmmssToDateObj(str){
	var yyyy = str.substr(0,4);
	var mm = str.substr(4,2);
	var dd = str.substr(6,2);
	var h = str.substr(8,2);
	var m = str.substr(10,2);
	var s = str.substr(12,2);
	var date = new Date(yyyy+'/'+mm+'/'+dd+' '+h+':'+m+':'+s);
	return date;
}


/*--------------------------------------------------------------
	ランキングAPI：検索
--------------------------------------------------------------*/
function searchJCOMRankingAPI(searchObj,statusObj){

	trace('ランキングAPI（jcom_api）：検索');
	var result = [];
	var message = "";
	var dataType = "jsonp";
	var jsonpCallback = statusObj.jsonpCallback;
	var url = "https://tvguide.myjcom.jp/api/getRankingInfo/?";

	trace("jsonpCallback "+jsonpCallback);
	trace(searchObj);
	trace(statusObj);

	if(isMyjcom){
		url += "callback=?"+getAPIRequestQuery(searchObj,false);
		trace("ランキングAPI（jcom_api）：myjcom "+url);
	}else{
		var param = getAPIRequestQuery(searchObj,true);
		url = api_php_path+'wrp='+jsonpCallback+'&url='+url+param;
		url = location.protocol+"//"+location.host+url;	// ローカルからアクセスできるよう絶対パスで指定
		trace("ランキングAPI（jcom_api）：other "+url);
	}

	var callback = statusObj.callback;
	var load_status;

	$.ajax({
		url: url,
		type:'POST',
			dataType: dataType,
		jsonpCallback: jsonpCallback
	}).done(function(data){ // Ajaxリクエストが成功した時発動
		trace("ランキングAPI（jcom_api）：DONE");

		if(data === undefined) {
			result = ['検索失敗'];    
			load_status = 2;
			trace("検索失敗");
			return;
		}
		
		//		trace("======================");
		//		trace(data);
		load_status = data.status;
		if(load_status != 0) return;
		var pdata = data.RankingList;

		var format_ja = ['年','月','日'];
		var format_en = ['/','/',''];
		var summaryFrom = formatDateYYYYMMDDhhmmss(data.summaryFrom,format_ja);
		var summaryTo = formatDateYYYYMMDDhhmmss(data.summaryTo,format_ja);
		var summaryFrom_en = formatDateYYYYMMDDhhmmss(data.summaryFrom,format_en);
		var summaryTo_en = formatDateYYYYMMDDhhmmss(data.summaryTo,format_en);
		var summaryFrom_short = formatDateYYYYMMDDhhmmss_short(data.summaryFrom);
		var summaryTo_short = formatDateYYYYMMDDhhmmss_short(data.summaryTo);
		statusObj.summaryFrom = summaryFrom;
		statusObj.summaryTo = summaryTo;
		statusObj.summaryFrom_en = summaryFrom_en;
		statusObj.summaryTo_en = summaryTo_en;
		statusObj.summaryFrom_short = summaryFrom_short;
		statusObj.summaryTo_short = summaryTo_short;
		statusObj.summaryFromOrg = data.summaryFrom;
		statusObj.summaryToOrg = data.summaryTo;
		var isMoreSerch = (statusObj.serchTxt.length != 0) ? true : false;

		if(pdata.length != 0){
			var rank = 1;
			var limit = statusObj.limit;
				
			var nowtime = new Date();
			nowYear = formatDate(nowtime, 'YYYY');
			nowMonth = formatDate(nowtime, 'MM');
			nowDay = formatDate(nowtime, 'DD');

			//	APIの戻り値をNGワード処理して検索結果データを作成
			jQuery.each(pdata, function(key, val){
					
					//trace(val);
					var score = val.score;
					var prevRank = (val.prevRank != "") ? val.prevRank : "-";
					var programId = val.programId;
					var title = val.title;
					var url = val.url;
					var photos = val.photos;
					var defaultChannelLogoUrl = val.defaultChannelLogoUrl;
					var channelLogoUrl = val.channelLogoUrl;
					var channelName = val.channelName;
					var nextBroadcast = val.nextBroadcast;
					var warningMessage = val.warningMessage;
					var errorCode = val.errorCode;
					var errorMessage = val.errorMessage;
					var status = 'DOWN';
					
					if(rank == prevRank){
						status = "STAY";
					}else if(rank < prevRank){
						status = "UP";
					}else if(prevRank == ""){
						status = "NEW";
					}
					
					var obj = {
						rank:rank,
						score:score,
						prevRank:prevRank,
						status:status,
						programId:programId,
						title:title,
						url:url,
						hasPhoto:false,
						hasChannelLogo:false,
						defaultChannelLogoUrl:defaultChannelLogoUrl,
						channelLogoUrl:channelLogoUrl,
						channelName:channelName,
						warningMessage:warningMessage,
						nextBroadcast:nextBroadcast,
						errorCode:errorCode,
						errorMessage:errorMessage,
						hasNextBroadcast:false,
						noimage:statusObj.noimage
					};
					
					//	デフォルトチャンネルロゴ
					if(defaultChannelLogoUrl){
						obj.hasChannelLogo = true;
					}

					//	メイン写真
					if(photos.length != 0){
						obj.photo = photos[0].photo;
						obj.copyright = photos[0].copyright;
						obj.hasPhoto = true;
					}else{
						obj.photo = statusObj.noimage;
						obj.copyright = "";
					}
					
					//	番組情報
					if(nextBroadcast.length != 0){
						//	放送時間
						var next_dateObj = YYYYMMDDhhmmssToDateObj(nextBroadcast[0].startDateTime);
						var onairTimeObj = checkThisProgramNowOnair(next_dateObj,nextBroadcast[0].startDateTime,nextBroadcast[0].endDateTime);

						obj.eid = nextBroadcast[0].eid;
						obj.nextTitle = nextBroadcast[0].nextTitle;
						obj.startDateTime = nextBroadcast[0].startDateTime;
						obj.endDateTime = nextBroadcast[0].endDateTime;
						obj.airTime = nextBroadcast[0].airTime;
						obj.genreIds = nextBroadcast[0].genreIds;
						obj.serviceCode = nextBroadcast[0].serviceCode;
						obj.channelNo = nextBroadcast[0].channelNo;
						obj.channelName = nextBroadcast[0].channelName;
						obj.channelLogoUrl = nextBroadcast[0].channelLogoUrl;
						obj.hasNextBroadcast = true;
						obj.nowonair = onairTimeObj.nowonair;
						obj.todayonair = onairTimeObj.todayonair;
						
					}

					//	追加検索ワードで絞り込むk
					if(isMoreSerch){
						var isHit = false;
						
						var len = statusObj.serchTxt.length;
						for(var i=0;i<len;i++){
							var word = statusObj.serchTxt[i];
							//if(title.indexOf(word) != -1) isHit = true;
							if (title.includes(word)) isHit = true;
						}//	for

						if(isHit){
							result.push(obj);
							rank++;
						}
					}else{
						result.push(obj);
						rank++;
					}
						
			});//jQuery.each

		}else{
			//    検索結果なし
			result = ['検索結果はありません'];    
			load_status = 1;
		}
	}).fail(function(data){  // Ajaxリクエストが失敗した時発動
		result = ["APIエラー："+data.errorMassage];    
		load_status = 2;
		trace("ランキングAPI（jcom_api）：FAIL "+result);

	}).always(function(data){  // Ajaxリクエストが成功・失敗どちらでも発動
		trace("ランキングAPI（jcom_api）：ALWAYS");
		trace(searchObj);
		trace(statusObj);
		trace(data);

		statusObj.api_type = 'ranking';
		if(callback != null) parent[callback](result,load_status,searchObj,statusObj);
	});

}


/*==============================================
	
	2020/3/13
	関連番組取得API
	getRelatedProgramInfo

	//	APIパラメータ
	var searchObj = {
		//[01]:[02],	// [03] [04] [06] 初期値（[05]）	
		tag:'これぞアメリカンホラー！,コンビの力で事件を解決!',	// 必須 関連番組タグ  初期値（-）	
		exclude:0,	// 任意 番組除外 0(除外しない) 1(除外する) 初期値（1）	
		sourceChannelType:3,	// 条件 検索元番組放送波 2(地上波)3(BS)120(CATV)200(コミュニティチャンネル) 初期値（-）	
		sourceServiceCode:'29752_32295',	// 任意 検索元番組サービスコード  初期値（-）	
		sourceEventId:40273,	// 任意 検索元番組イベントID  初期値（-）	
		sourceProgramDate:20130911,	// 任意 検索元番組放送日  初期値（-）	
		areaId:30,	// 必須 エリアID  初期値（-）	
		serviceCode:'191_4,570_65406',	// 任意 サービスコード  初期値（-）	
		genreId:'62,4',	// 任意 ジャンルID  初期値（-）	
		since:'201702011200',	// 任意 放送日（開始）  初期値（現在日時）	
		until:'201702811200',	// 任意 放送日（終了）  初期値（-）	
		adult:1,	// 任意 アダルトチャンネル制御 0(含めない) 1(含める) 初期値（0）	
		limit:50,	// 任意 最大取得件数  初期値（20）	

		};	
		
	//	制御用パラメータ
	var statusObj = {
		uid:0,	//	UID
		container:'.ranking_list',		//格納コンテナ（.付きの文字列で指定）デフォルト：.ranking_list　省略可
		noimage:'/special/common/images/no_image_800x448.jpg',		//画像がない場合の代替え画像　省略可
		callback:'searchRelatedProgramAPIComplete',	//	コールバック関数 デフォルト：searchRelatedProgramAPIComplete　省略可
	};	
		
	//	データ呼び出し
	getJcomRelatedProgramList(searchObj,statusObj);
	
==============================================*/

function getJcomRelatedProgramList(_searchObj,_statusObj){
	setCurrentTimeForAPI();
	
	var user_area_id = jQuery.cookie("area_id");
	if(user_area_id == undefined){
		user_area_id = 12;
	}
	var searchObj = {};
	var statusObj = {};
	
	// _searchObjからAPI検索用Objを抽出
	
	if(_searchObj.tag != null){
		searchObj.tag = _searchObj.tag;
	}
	if(_searchObj.exclude != null){
		searchObj.exclude = _searchObj.exclude;
	}
	if(_searchObj.sourceChannelType != null){
		searchObj.sourceChannelType = _searchObj.sourceChannelType;
	}
	if(_searchObj.sourceServiceCode != null){
		searchObj.sourceServiceCode = _searchObj.sourceServiceCode;
	}
	if(_searchObj.sourceEventId != null){
		searchObj.sourceEventId = _searchObj.sourceEventId;
	}
	if(_searchObj.sourceProgramDate != null){
		searchObj.sourceProgramDate = _searchObj.sourceProgramDate;
	}
	if(_searchObj.areaId != null){
		searchObj.areaId = _searchObj.areaId;
	}else{
		searchObj.areaId = user_area_id;
	}
	if(_searchObj.serviceCode != null){
		searchObj.serviceCode = _searchObj.serviceCode;
	}
	if(_searchObj.genreId != null){
		searchObj.genreId = _searchObj.genreId;
	}
	if(_searchObj.since != null){
		searchObj.since = _searchObj.since;
	}
	if(_searchObj.until != null){
		searchObj.until = _searchObj.until;
	}
	if(_searchObj.adult != null){
		searchObj.adult = _searchObj.adult;
	}
	if(_searchObj.limit != null){
		searchObj.limit = _searchObj.limit;
	}

	// _statusObjから制御用Objを抽出
	if(_statusObj.uid != null) statusObj.uid = _statusObj.uid;
	if(_statusObj.container != null){
		statusObj.container = _statusObj.container;
	}else{
		statusObj.container = '.ranking_list';
	}
	if(_statusObj.container_parent != null){
		statusObj.container_parent = _statusObj.container_parent;
	}
	if(_statusObj.noimage != null){
		statusObj.noimage = _statusObj.noimage;
	}else{
		statusObj.noimage = '/special/common/images/no_image_800x448.jpg';
	}
	if(_statusObj.callback != null){
		statusObj.callback = _statusObj.callback;
	}else{
		statusObj.callback = "searchRelatedProgramAPIComplete";
	}

	// コールバックパラメータ名の指定
	jsonpCallbackUID ++;
	statusObj.jsonpCallback = 'relationProgram'+jsonpCallbackUID;

	searchJcomRelatedProgramAPI(searchObj,statusObj);
}


/*--------------------------------------------------------------
	関連番組API：検索
--------------------------------------------------------------*/
function searchJcomRelatedProgramAPI(searchObj,statusObj){
	trace('関連番組API（jcom_api）：検索');
	var result = [];
	var message = "";
	var dataType = "jsonp";
	var jsonpCallback = statusObj.jsonpCallback;
	var url = "https://tvguide.myjcom.jp/api/getRelatedProgramInfo/?";

	trace("jsonpCallback "+jsonpCallback);
	trace(searchObj);
	trace(statusObj);

	if(isMyjcom){
		url += "callback=?"+getAPIRequestQuery(searchObj,false);
		trace("関連番組API（jcom_api）：myjcom "+url);
	}else{
	var param = getAPIRequestQuery(searchObj,true);
		url = api_php_path+'wrp='+jsonpCallback+'&url='+url+param;
		url = location.protocol+"//"+location.host+url;	// ローカルからアクセスできるよう絶対パスで指定
		trace("関連番組API（jcom_api）：other "+url);
	}

	var callback = statusObj.callback;
	var load_status;

	$.ajax({
		url: url,
		type:'POST',
		dataType: dataType,
		jsonpCallback: jsonpCallback
	}).done(function(data){ // Ajaxリクエストが成功した時発動
		trace("関連番組API（jcom_api）：DONE");

		if(data === undefined) {
			result = ['検索失敗'];    
			load_status = 2;
			trace("検索失敗");
			return;
		}

		//		trace("======================");
		//		trace(data);
		load_status = data.status;
		totalCount = data.totalCount;
		if(load_status != 0) return;
		if(totalCount == 0) return;

		var pdata = data.tags[0].programs;
		trace(pdata);

		if(pdata.length != 0){

		var limit = statusObj.limit;

		var nowtime = new Date();
		nowYear = formatDate(nowtime, 'YYYY');
		nowMonth = formatDate(nowtime, 'MM');
		nowDay = formatDate(nowtime, 'DD');

		//	APIの戻り値をNGワード処理して検索結果データを作成
		jQuery.each(pdata, function(key, val){
			var title = val.title; //	番組名
			var startTimeOrg = val.startTime; //	放送開始日時
			var endTimeOrg = val.endTime; //	放送終了日時
			var airTime = val.airTime; //	放送時間
			var programDate = val.programDate; //	放送日
			var eventId = val.eventId; //	イベントID
			var serviceCode = val.serviceCode; //	サービスコード
			var channelType = val.channelType; //	放送波
			var channelNo = val.channelNo; //	チャンネル番号
			var channelName = val.channelName; //	チャンネル名
			var channelLogoUrl = val.channelLogoUrl; //	チャンネルロゴファイルURL
			var genreIds = val.genreIds; //	ジャンルID
			var summary = val.summary; //	番組概要
			//var url = 'https://tvguide.myjcom.jp/'+val.url; //	番組詳細URL
			var url = val.url; //	番組詳細URL
			var photos = val.photo; //	番組属性リスト

			var date = val.startTime.slice(0,4) + '/' + val.startTime.slice(4,6) + '/' + val.startTime.slice(6,8); // 放送日yyyy/mm/ddに
			var dateObj = new Date(date);
			var datestr = formatDate(new Date(date), 'MM月DD日（W）');
			var startTime = val.startTime.slice(8,10) + ':' + val.startTime.slice(10,12);
			var endTime = val.endTime.slice(8,10) + ':' + val.endTime.slice(10,12);
			var channel_icon_id = channel_icon[val.channelName];

			var month = formatDate(dateObj, 'MM');
			var day = formatDate(dateObj, 'DD');
			var week = formatDate(dateObj, 'W');

			var datestr_single = Number(month)+'月'+Number(day)+'日（'+week+'）';
			var datestr_simple = month+'/'+day+'（'+week+'）';
			var datestr_simple_single = Number(month)+'/'+Number(day)+'（'+week+'）';
			var datestr_simple_single2 = Number(month)+'/'+Number(day)+'('+week+')';			

			var obj = {
				title:title,
				startTimeOrg:startTimeOrg,
				endTimeOrg:endTimeOrg,
				startTime:startTime,
				endTime:endTime,
				airTime:airTime,
				programDate:programDate,
				date:datestr,
				eventId:eventId,
				serviceCode:serviceCode,
				channelType:channelType,
				channelNo:channelNo,
				channelName:channelName,
				channelLogoUrl:channelLogoUrl,
				genreIds:genreIds,
				summary:summary,
				url:url,
				photos:photos,
				dateObj:dateObj,
				datestr_single:datestr_single,
				datestr_simple:datestr_simple,
				datestr_simple_single:datestr_simple_single,
				datestr_simple_single2:datestr_simple_single2,
			};

			//	メイン写真
			if(photos.length != 0){
				obj.photo = 'https://tvguide.myjcom.jp/'+photos[0].photo;
				obj.copyright = photos[0].copyright;
				obj.hasPhoto = true;
			}else{
				obj.photo = statusObj.noimage;
				obj.copyright = "";
			}

				result.push(obj);


			});//jQuery.each

		}else{
			//    検索結果なし
			result = ['検索結果はありません'];    
			load_status = 1;
		}
	}).fail(function(data){  // Ajaxリクエストが失敗した時発動
		result = ["APIエラー："+data.errorMassage];    
		load_status = 2;
		trace("関連番組API（jcom_api）：FAIL "+result);
	}).always(function(data){  // Ajaxリクエストが成功・失敗どちらでも発動
		trace("関連番組API（jcom_api）：ALWAYS");
		trace(searchObj);
		trace(statusObj);
		trace(data);

		searchObj.searchBtnURL = 'https://tvguide.myjcom.jp/search/event/?tag='+searchObj.tag;

		statusObj.api_type = 'related';
		if(callback != null) parent[callback](result,load_status,searchObj,statusObj);
	});

}



/*==============================================

	2019/2/18
	イベントプレゼントAPI

	//	APIパラメータ
	var searchObj = {
		title: "",
		addKeywords: "",
		mso: "",
		channel: "",
		magazine: "",
		limit: "",
		order: ""
	};	

	//	"displayListStartDate desc" // 新着 降順　最新が先（デフォルト、省略化）
	//	"displayListStartDate aesc" // 新着 昇順
	//	"displayListEndDate desc" // 閉め切り 昇順
	//	"displayListEndDate aesc" // 閉め切り 昇順 締め切りが近い順

	//	制御用パラメータ
	var statusObj = {
		uid:0,	//	UID
		addCC:false,	//	リンクにccを追加するか
		ignoreDate:false,	//	掲載開始時期前、または掲載開始時時期が未設定でも表示する（true）表示しない（false）
		container:'.event_present_list_container',		//格納コンテナ（.付きの文字列で指定）デフォルト：.event_present_list_container　省略可
		wrpper:'.section_present_api',		//格納セクション（.付きの文字列で指定）デフォルト：.section_present_api　省略可
		callback:'searchProgramAPIComplete'	//	コールバック関数 デフォルト：searchProgramAPIComplete　省略可
	};	

	//	データ呼び出し
	getJcomEventPresentList(searchObj,statusObj);
	
==============================================*/
function getJcomEventPresentList(_searchObj,_statusObj){
	trace("イベントプレゼントAPI getJcomEventPresentList");
	setCurrentTimeForAPI();
	
	var searchObj = {};
	var statusObj = {};
	
	// _searchObjからAPI検索用Objを抽出

	if(_searchObj.limit != null){
		statusObj.limit = _searchObj.limit;
	}else{
		searchObj.limit = "";
	}
	if(_searchObj.title != null){
		searchObj.title = _searchObj.title;
	}else{
		searchObj.title = "";
	}
	if(_searchObj.addKeywords != null){
		searchObj.addKeywords = _searchObj.addKeywords;
	}else{
		searchObj.addKeywords = "";
	}
	if(_searchObj.channel != null){
		searchObj.channel = _searchObj.channel;
	}else{
		searchObj.channel = "";
	}
	if(_searchObj.mso != null){
		searchObj.mso = _searchObj.mso;
	}else{
		searchObj.mso = "";
	}
	if(_searchObj.magazine != null){
		searchObj.magazine = _searchObj.magazine;
	}else{
		searchObj.magazine = "";
	}
	if(_searchObj.order != null){
		searchObj.order = _searchObj.order;
	}else{
		searchObj.order = "displayListStartDate desc";
	}

	// _statusObjから制御用Objを抽出
	
	if(_statusObj.uid != null) statusObj.uid = _statusObj.uid;
	if(_statusObj.container != null){
		statusObj.container = _statusObj.container;
	}else{
		statusObj.container = '.event_present_list_container';
	}
	if(_statusObj.container_parent != null){
		statusObj.container_parent = _statusObj.container_parent;
	}
	if(_statusObj.callback != null){
		statusObj.callback = _statusObj.callback;
	}else{
		statusObj.callback = "searchEventPresentAPIComplete";
	}
	if(_statusObj.addCC != null){
		statusObj.addCC = _statusObj.addCC;
	}else{
		statusObj.addCC = false;
	}
	if(_statusObj.ignoreDate != null){
		statusObj.ignoreDate = _statusObj.ignoreDate;
	}else{
		statusObj.ignoreDate = false;
	}
	
	if(_statusObj.wrpper != null){
		statusObj.wrpper = _statusObj.wrpper;
	}else{
		statusObj.wrpper = "section_present_api";
	}
	
	/**
	if(statusObj.uid == 0){
		trace("------------------------　"+statusObj.uid)
		trace(searchObj);
		trace(statusObj);
		trace(statusObj.container);
	}
	//output(searchObj);
	//output(statusObj);
	/**/
	searchJCOMEventPresentAPI(searchObj,statusObj);
}


/*--------------------------------------------------------------
	2018/10/25
	イベントプレゼントAPI：検索
--------------------------------------------------------------*/
function searchJCOMEventPresentAPI(searchObj,statusObj){
	trace("イベントプレゼントAPI：検索開始（jcom_api）");
	
	var message = "";
	var url = "https://c.myjcom.jp/jsonp/event_present.js?callback=?";
	var callback = statusObj.callback;
	var now = new Date();
	var nowdate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
	
	jQuery.getJSON(url, searchObj, function(data, status, xhr){
		trace("イベントプレゼントAPI：検索結果（jcom_api）");
		var data = $.parseJSON(data);

		trace(data);
		var data_arr = [];
		var len = data.results.length;
		for(var i=0;i<len;i++){
			var targetObj = data.results[i];

			//  リンクのcc-対応
			targetObj.linkurl = targetObj.link;
			if(statusObj.addCC){
				var link_arr = targetObj.link.split('//');
				targetObj.link = link_arr[0]+'//cc-'+link_arr[1];
			}
			//trace("link "+targetObj.link);

			var pubCloseDate;
			var lastdate;
			
			//trace("pubCloseDate　"+targetObj.pubCloseDate);
			
			if(targetObj.pubCloseDate){
				//trace("pubCloseDate　有効");
				pubCloseDate = targetObj.pubCloseDate;
				lastdate = pubCloseDate.replace( '-', '/' );
				while(lastdate !== pubCloseDate) {
					pubCloseDate = pubCloseDate.replace('-', '/');
					lastdate = lastdate.replace('-', '/');
				}
				targetObj.lastdate = lastdate.split(' ')[0];
				if(targetObj.closingDateNonDisplay == "on") targetObj.pubCloseDate = '';

			}else{
				//trace("pubCloseDate　無効");
				targetObj.pubCloseDate = "";
			}

			var pubDate = targetObj.pubDate;
			var startdate = pubDate.replace( '-', '/' );
			while(startdate !== pubDate) {
					pubDate = pubDate.replace('-', '/');
					startdate = startdate.replace('-', '/');
			}
			
			//  掲載開始時期を考慮する
			if(!statusObj.ignoreDate){
				//trace("掲載開始時期を考慮する");
			
				//  掲載開始時期
				if(pubDate != null){
					startDay = new Date(pubDate);
					targetObj.startDay = startDay;
					if(startDay <= now){
						isDisplay = true;
					}else{
						isDisplay = false;
					}
				}
				
				//  終了前であればリストに追加
				if(pubCloseDate != null){
					var endDate = new Date(lastdate);
					targetObj.endDate = endDate;
					if(nowdate <= endDate && isDisplay){
						data_arr.push(targetObj);
					}
				}
				
			}else{
				//trace("掲載開始時期を考慮しない");
				data_arr.push(targetObj);
			}

		}//	for

		/**
		if(statusObj.uid == 0) {
			trace("番組表API（jcom_api）：検索結果 --------");
			trace(status);	
			trace(xhr);
			trace(data);
			trace(data_arr);
		}
		//*/

		statusObj.api_type = 'event_present';
		if(callback != null) parent[callback](data_arr,status,searchObj,statusObj);

	});// jQuery.getJSON
}

/*==============================================
	
	2019/6/12
	チャンネルIDのリストからチャンネル情報を返す
	
==============================================*/
var loadedJcomChannelIDNum = 0;
var loadedJcomChannelIDTotalNum = 0;
var loadedJcomChannelIDData;
var loadedJcomChannelIDDataCallbackFunc;
function getJcomChannelDataByChannelIDList(list,callbackfunc){
	loadedJcomChannelIDTotalNum = list.length;
	loadedJcomChannelIDData = new Array(loadedJcomChannelIDTotalNum);
	loadedJcomChannelIDDataCallbackFunc = callbackfunc;
	
	for(var i=0;i<loadedJcomChannelIDTotalNum;i++){
		var searchObj = { channelId:list[i] };	
		
		//	制御用パラメータ
		var statusObj = {
				uid:i,	//	UID
				callback:'getJcomChannelDataByChannelIDListComplete'	//	コールバック関数 デフォルト：searchProgramAPIComplete　省略可
			};

		//	データ呼び出し	jcom_api.js
		getJcomChannelList(searchObj,statusObj);

	}//	for
}

//	チャンネル情報取得コールバック
function getJcomChannelDataByChannelIDListComplete(result,status,searchObj,statusObj){
	//trace("チャンネル情報取得完了：getJcomChannelDataByChannelIDListComplete　"+status);
	
	loadedJcomChannelIDNum ++;
	loadedJcomChannelIDData[statusObj.uid] = result.channel[0];
	
	//trace(loadedJcomChannelNum +" / "+loadedJcomChannelTotalNum +"  "+statusObj.uid);
	
	if(loadedJcomChannelIDTotalNum <= loadedJcomChannelIDNum ){
		if(loadedJcomChannelIDDataCallbackFunc != null) parent[loadedJcomChannelIDDataCallbackFunc](loadedJcomChannelIDData,status,searchObj,statusObj);
	}
}

/*==============================================
	
	2018/5/23
	チャンネル名のリストからチャンネル情報を返す
	
==============================================*/
var loadedJcomChannelNum = 0;
var loadedJcomChannelTotalNum = 0;
var loadedJcomChannelData;
var loadedJcomChannelDataCallbackFunc;
var loadedJcomChanneIsNodataList = [];
function getJcomChannelDataByChannelList(list,callbackfunc){
	loadedJcomChannelTotalNum = list.length;
	loadedJcomChannelData = new Array(loadedJcomChannelTotalNum);
	loadedJcomChannelDataCallbackFunc = callbackfunc;

	for(var i=0;i<loadedJcomChannelTotalNum;i++){
		var channel = list[i];		
		var data = getChannelDataByName(channel);//	チャンネル名からチャンネル情報を取得
		//trace(i+" チャンネル名のリストからチャンネル情報を返す "+channel);
		//trace(data.channelID);
		
		var searchObj = { channelId:data.channelID };	
		
		//if(channel == 'スポーツライブ＋') searchObj = { channelId:'410' };	

		//	制御用パラメータ
		var statusObj = {
				uid:i,	//	UID
				callback:'getJcomChannelDataByChannelListOneDataLoadedComplete'	//	コールバック関数 デフォルト：searchProgramAPIComplete　省略可
			};

		//	データ呼び出し	jcom_api.js
		getJcomChannelList(searchObj,statusObj);

	}//	for
}

//	チャンネル情報取得コールバック
function getJcomChannelDataByChannelListOneDataLoadedComplete(result,status,searchObj,statusObj){
//	trace("チャンネル情報取得完了：getJcomChannelDataByChannelListOneDataLoadedComplete　"+status+"："+searchObj.channelId);
//	trace(loadedJcomChannelData);
//	trace(result);
//	trace("result.channel.length  "+result.channel.length );
//	

	loadedJcomChannelNum ++;
	loadedJcomChannelData[statusObj.uid] = result.channel[0];	
	
	if(Object.prototype.toString.call(result.channel[0]) !== "[object Object]"){
		//trace("objectではない "+statusObj.uid);
		loadedJcomChanneIsNodataList.push(statusObj.uid);
	}
	
	if(loadedJcomChannelTotalNum <= loadedJcomChannelNum ){
//		trace("全てのチャンネル情報取得完了：getJcomChannelDataByChannelListOneDataLoadedComplete　"+status);
//		trace(loadedJcomChannelData);
		
		var resultList = [];
		var len = loadedJcomChannelData.length;
		for(var i=0;i<len;i++){
			var data = loadedJcomChannelData[i];
			
			var isNG = false;
			var len2 = loadedJcomChanneIsNodataList.length;
			for(var v=0;v<len2;v++){
				var id = loadedJcomChanneIsNodataList[v];
				if(id == i) isNG = true;
			}//	for
			
			if(!isNG) resultList.push(data);
			
		}//	for
		
		if(loadedJcomChannelDataCallbackFunc != null) parent[loadedJcomChannelDataCallbackFunc](resultList);
		
		//if(loadedJcomChannelDataCallbackFunc != null) parent[loadedJcomChannelDataCallbackFunc](loadedJcomChannelData);
	}
}


/*==============================================
	
	2019/6/14
	チャンネル名のリストからチャンネル情報を返す（まとめて取得）
	
==============================================*/
var jcomChannelDataByChannelList;
var jcomChannelDataByChannelIDList = [];
var jcomChannelDataByChannelListCallbackFunc;
function getJcomChannelAllDataByChannelList(list,callbackfunc,targetChannels){
	jcomChannelDataByChannelList = list;
	jcomChannelDataByChannelListCallbackFunc = callbackfunc;

	var len = jcomChannelDataByChannelList.length;
	for(var i=0;i<len;i++){
		var data = getChannelDataByName(jcomChannelDataByChannelList[i]);
		///trace(data);
		var channelID = data.channelID;
		jcomChannelDataByChannelIDList.push(channelID);
	}//	for
	
	//	APIパラメータ
	var searchObj = {
		targetChannels:targetChannels,	//	放送波種別　0(CATV)、1(コミュニティチャンネル)、2(BS)、3(地デジ)、4(FM放送)　カンマ区切りで複数設定可
	};	
	
	//	制御用パラメータ
	var statusObj = {
			uid:0,	//	UID
		callback:'getJcomChannelAllDataByChannelListComplete'	//	コールバック関数 デフォルト：searchProgramAPIComplete　省略可
	};
	//	データ呼び出し	jcom_api.js
	getJcomChannelList(searchObj,statusObj);
}

function getJcomChannelAllDataByChannelListComplete(result,status,searchObj,statusObj){
	trace('getJcomChannelAllDataByChannelListComplete jcom_api.js')
	trace(result);
	
	var resultList = [];
	var channelList = result.channel;
	var datalen = jcomChannelDataByChannelList.length;
	var channellen = channelList.length;

	for(var i=0;i<datalen;i++){
		var channelID = jcomChannelDataByChannelIDList[i];
		for(var v=0;v<channellen;v++){
			var id = channelList[v].channelId;
			if(channelID == id){
				resultList.push(channelList[v]);
				break;
			}
		}//	for
	}//	for
	
	if(jcomChannelDataByChannelListCallbackFunc != null) parent[jcomChannelDataByChannelListCallbackFunc](resultList);
}

/*==============================================
	
	2018/4/26
	チャンネル情報API

	//	APIパラメータ
	var searchObj = {
		//areaId:12,	// エリアID　省略可
		//course:1,	// コースID　デフォルト（指定なし）、1(スタンダードプラス)、2(スタンダード)、3(コンパクト)、4(セレクトA)、5(セレクトB)、6(セレクトC)
		//channelId:'159_65406',	//	チャンネルID　カンマ区切りで複数設定可（OR検索）
		//option:'159_65406',	//	オプションフラグ　カンマ区切りで複数設定可（OR検索）
		genre:'2001',	//	ジャンルID　デフォルト（指定なし）で全てのジャンル　カンマ区切りで複数設定可（OR検索）
		//subGenre:'3001,3003',	// サブジャンルID カンマ区切りで複数指定可(OR検索)。未指定時は全サブジャンル指定となる。
		//targetChannels:'0,1',",	//	放送波種別　0(CATV)、1(コミュニティチャンネル)、2(BS)、3(地デジ)、4(FM放送)　カンマ区切りで複数設定可
		//sort:0,	//	ソート種別　0(放送日時：デフォルト)、1(チャンネル)、2(ジャンルID)
		//order:0,	//	昇降順　0(昇順：デフォルト)、1(降順)
		//getFeatureInfo:1,//注目情報要求フラグ 1でリクエストされた場合、注目番組情報をレスポンスに含める。
	};	
	
	//	制御用パラメータ
	var statusObj = {
		uid:0,	//	UID
		container:'.tv_channel_list',		//	番組表格納コンテナ（.付きの文字列で指定）デフォルト：.tv_program_list　省略可
		callback:'searchChannelAPIComplete'	//	コールバック関数 デフォルト：searchProgramAPIComplete　省略可
	};
	
	//	データ呼び出し	jcom_api.js
	getJcomChannelList(searchObj,statusObj);
	
==============================================*/
function getJcomChannelList(_searchObj,_statusObj){
	//trace("チャンネル情報API（jcom_api.j）：getJcomChannelList");
	setCurrentTimeForAPI();
	var searchObj = {};
	var statusObj = {};
	
	// _searchObjからAPI検索用Objを抽出
	
	if(!_searchObj.areaId != null){
		var aid = jQuery.cookie("area_id");
		
		if(aid != undefined){
			area_id = aid;
		}else{
			area_id = 12;
		}
		searchObj.areaId = area_id;
	}

	if(_searchObj.getFeatureInfo != null){
		searchObj.getFeatureInfo = _searchObj.getFeatureInfo;
	}
	
	if(_searchObj.course != null){
		searchObj.course = _searchObj.course;
	}
	if(_searchObj.channelId != null){
		searchObj.channelId = _searchObj.channelId;
	}
	if(_searchObj.option != null){
		searchObj.option = _searchObj.option;
	}
	if(_searchObj.genre != null){
		searchObj.genre = _searchObj.genre;
	}
	/**/
	//	サブジャンルは有効ではない？　2018/4/27
//	if(_searchObj.subGenre != null){
//		searchObj.subGenre = _searchObj.subGenre;
//	}//*/
	if(_searchObj.course != null){
		searchObj.course = _searchObj.course;
	}
	if(_searchObj.targetChannels != null){
		searchObj.targetChannels = _searchObj.targetChannels;
	}
	if(_searchObj.sort != null){
		searchObj.sort = _searchObj.sort;
	}
	if(_searchObj.order != null){
		searchObj.order = _searchObj.order;
	}
	
	
	// _statusObjから制御用Objを抽出
	
	if(_statusObj.uid != null) statusObj.uid = _statusObj.uid;
	
	if(_statusObj.container != null){
		statusObj.container = _statusObj.container;
	}else{
		statusObj.container = '.tv_channel_list';
	}

	if(_statusObj.callback != null){
		statusObj.callback = _statusObj.callback;
	}else{
		statusObj.callback = "searchChannelAPIComplete";
	}
	if(_statusObj.research != null){
		statusObj.research = _statusObj.research;
	}else{
		statusObj.research = false;
	}

	// コールバックパラメータ名の指定
	jsonpCallbackUID ++;
	statusObj.jsonpCallback = 'search_channel'+jsonpCallbackUID;

	/**
	trace("------------------------　チャンネルAPI（jcom_api）　"+statusObj.uid)
	trace(searchObj);
	trace(statusObj);
	trace(statusObj.container);
	//output(searchObj);
	//output(statusObj);
	/**/
	searchJCOMChannelAPI(searchObj,statusObj);
}

/*--------------------------------------------------------------
	チャンネルAPI：検索
--------------------------------------------------------------*/
function searchJCOMChannelAPI(searchObj,statusObj){
  //trace("チャンネルAPI（jcom_api.js）：検索");
	var result = [];
	var message = "";
	var dataType = "jsonp";
	var jsonpCallback = statusObj.jsonpCallback;
	var url = 'https://tvguide.myjcom.jp/api/getChannelInfo/?';
	//if(isStage) url = "https://stage-tvguide.myjcom.jp/api/getChannelInfo/?";

	if(isMyjcom){
		url += "callback=?"+getAPIRequestQuery(searchObj,false);
		//trace("チャンネルAPI：myjcom "+url);
	}else{
		var param = getAPIRequestQuery(searchObj,true);
		//url = api_php_path+url+param;
		url = api_php_path+'wrp='+jsonpCallback+'&url='+url+param;
		url = location.protocol+"//"+location.host+url;	// ローカルからアクセスできるよう絶対パスで指定
		//trace("チャンネルAPI：other "+url);
	}

	var callback = statusObj.callback;
	var load_status;

	$.ajax({
		url: url,
		type:'POST',
		dataType: dataType,
		jsonpCallback: jsonpCallback // コールバックパラメータ名の指定
	}).done(function(data){ // Ajaxリクエストが成功した時発動
		//trace("チャンネルAPI（jcom_api.js）：検索 DONE");
		//trace(data);
		load_status = 0;
		result = data;
		}).fail(function(data){  // Ajaxリクエストが失敗した時発動
		//trace("チャンネルAPI（jcom_api.js）：検索 FAIL");
		//trace(data);
		result = ["APIエラー："+data.errorMassage];
		message = ["APIエラー："+data.errorMassage];
		load_status = 2;
	}).always(function(data){  // Ajaxリクエストが成功・失敗どちらでも発動
		//trace("チャンネルAPI（jcom_api.js）：検索 FAIL");

		statusObj.api_type = 'channel';
		if(callback != null) parent[callback](result,load_status,searchObj,statusObj);
	});//$.ajax({

}



/*==============================================
	
	2018/4/26
	おすすめAPI

	//	APIパラメータ
	var searchObj = {
		//kijiId:0000077684,	// おすすめ記事ID　記事IDが指定された場合には、記事ID以外のリクエストパラメータは全て無視し、記事IDでのみ検索を行う。
		//serviceCode:'191_4,570_65406',	// サービスコード チャンネルを指定する。serviceId+'_'+networkIdで構成。カンマ区切りで複数指定可(OR検索)。
		//genre:'2001,2003',	// ジャンルID カンマ区切りで複数指定可(OR検索)。未指定時は全ジャンル指定となる。
		//subGenre:'3001,3003',	// サブジャンルID カンマ区切りで複数指定可(OR検索)。未指定時は全サブジャンル指定となる。
		since:'201804271200',	// 放送日（開始）yyyyMMddHHmmで指定する。時間指定は0000～2359の間で可能。
		until:'201805071200',	// 放送日（終了）yyyyMMddHHmmで指定する。時間指定は0000～2359の間で可能。
		//main:0,	// メインフラグ　0(イチオシなし：デフォルト)、1(メインジャンルのイチオシ、およびサブジャンルを内包するメインジャンルのイチオシ)、2(サブジャンルのイチオシ)
		//sort:0,	// ソート種別　0(放送日時：デフォルト)、1(チャンネル)、2(ジャンルID)
		//order:0,	// 昇降順　0(昇順：デフォルト)、1(降順)
		//offset:0,	// オフセット 返却する候補の最初の件数を指定する。Offsetで指定された番目からlimit件検索結果を返却する。
		limit:10,	// 最大取得件数 1～100件まで指定可。
	};	
		
	//	制御用パラメータ
	var statusObj = {
		uid:0,	//	UID
		container:'.tv_program_list',		//番組表格納コンテナ（.付きの文字列で指定）デフォルト：.tv_program_list　省略可
		ng_perfectmatching:false,	//	NGワードを完全一致とする（true）しない（false:デフォルト）　省略可
		ngwords:['スター・ウォーズ','科学'],	//	NGワード　配列で複数設定可能　省略可
		//unuseNgWords:true,	//	NGワードをキャンセル（true）する、しない（false:デフォルト）　省略可
		//research:false,	//	タグなどでの再検索の場合（true）通常検索の場合（false:デフォルト）　省略可
		callback:'searchRecommendProgramAPIComplete'	//	コールバック関数 デフォルト：searchProgramAPIComplete　省略可
	};	
		
		
	//	データ呼び出し	jcom_api.js
	getJcomRecommendProgram(searchObj,statusObj);
	
==============================================*/
function getJcomRecommendProgram(_searchObj,_statusObj){
	trace("おすすめAPI：jcom_api.js getJcomRecommendProgram");
	setCurrentTimeForAPI();
	
	var searchObj = {};
	var statusObj = {};
	
	// _searchObjからAPI検索用Objを抽出
	
	if(!_searchObj.areaId != null){
		var aid = jQuery.cookie("area_id");
		if(aid != undefined){
			area_id = aid;
		}else{
			area_id = 12;
		}
		searchObj.areaId = area_id;
	}
	
	if(_searchObj.kijiId != null){
		searchObj.kijiId = _searchObj.kijiId;
	}
	if(_searchObj.serviceCode != null){
		searchObj.serviceCode = _searchObj.serviceCode;
	}
	if(_searchObj.genre != null){
		searchObj.genre = _searchObj.genre;
	}
	if(_searchObj.subGenre != null){
		searchObj.subGenre = _searchObj.subGenre;
	}
	if(_searchObj.since != null){
		searchObj.since = _searchObj.since;
	}
	if(_searchObj.until != null){
		searchObj.until = _searchObj.until;
	}
	if(_searchObj.main != null){
		searchObj.main = _searchObj.main;
	}
	if(_searchObj.sort != null){
		searchObj.sort = _searchObj.sort;
	}
	if(_searchObj.order != null){
		searchObj.order = _searchObj.order;
	}
	if(_searchObj.offset != null){
		searchObj.offset = _searchObj.offset;
	}

	if(_searchObj.limit != null){
		searchObj.limit = 100;
		statusObj.limit = _searchObj.limit;
	}else{
		searchObj.limit = 100;
		statusObj.limit = 10;
	}
	// _statusObjから制御用Objを抽出
	
	if(_statusObj.uid != null) statusObj.uid = _statusObj.uid;
	if(_statusObj.container != null){
		statusObj.container = _statusObj.container;
	}else{
		statusObj.container = '.recommend_program_list';
	}
	if(_statusObj.container_parent != null){
		statusObj.container_parent = _statusObj.container_parent;
	}
	if(_statusObj.callback != null){
		statusObj.callback = _statusObj.callback;
	}else{
		statusObj.callback = "searchProgramAPIComplete";
	}
	if(_statusObj.research != null){
		statusObj.research = _statusObj.research;
	}else{
		statusObj.research = false;
	}
	
	if(_statusObj.only_pickup != null){
		statusObj.only_pickup = _statusObj.only_pickup;
	}else{
		statusObj.only_pickup = false;
	}

	// コールバックパラメータ名の指定
	jsonpCallbackUID ++;
	statusObj.jsonpCallback = 'search_recommend'+jsonpCallbackUID;

	/**/
	trace("------------------------　おすすめ番組　"+statusObj.uid)
	trace(searchObj);
	trace(statusObj);
	trace(statusObj.container);
	//output(searchObj);
	//output(statusObj);
	/**/
	searchJCOMRecommendProgramAPI(searchObj,statusObj);
}

/*--------------------------------------------------------------
	2019/3/22
	おすすめAPI：検索
--------------------------------------------------------------*/
function searchJCOMRecommendProgramAPI(searchObj,statusObj){
	trace("おすすめAPI：検索（jcom_api）");

	var result = [];
	var message = "";
	var dataType = "jsonp";
	var jsonpCallback = statusObj.jsonpCallback;
	var url = 'https://tvguide.myjcom.jp/api/getRecommendProgramInfo/?';
	//if(isStage) url = "https://stage-tvguide.myjcom.jp/api/getRecommendProgramInfo/?";

	if(isMyjcom){
		url += "callback=?"+getAPIRequestQuery(searchObj,false);
		trace("おすすめAPI：myjcom "+url);
	}else{
		var param = getAPIRequestQuery(searchObj,true);
		//url = api_php_path+url+param;
		url = api_php_path+'wrp='+jsonpCallback+'&url='+url+param;
		url = location.protocol+"//"+location.host+url;	// ローカルからアクセスできるよう絶対パスで指定
		trace("おすすめAPI：other "+url);
	}
	var callback = statusObj.callback;
	var load_status;
	/**/
	$.ajax({
		url: url,
		type:'POST',
			dataType: dataType,
		jsonpCallback: jsonpCallback // コールバックパラメータ名の指定
	}).done(function(data){ // Ajaxリクエストが成功した時発動
		trace("おすすめAPI：検索 DONE（jcom_api）");
		trace(data);
		load_status = 0;
		result = [];

		jQuery.each(data.contents, function(key, obj){
			// trace(key);
			// trace(obj);

			var dateObj = new Date(obj.startDate);
			var month = formatDate(dateObj, 'MM');
			var day = formatDate(dateObj, 'DD');
			var week = formatDate(dateObj, 'W');

			obj.datestr = month+'月'+day+'日（'+week+'）';
			obj.datestr_single = Number(month)+'月'+Number(day)+'日（'+week+'）';
			obj.datestr_simple = month+'/'+day+'（'+week+'）';
			obj.datestr_simple_single = Number(month)+'/'+Number(day)+'（'+week+'）';
			obj.datestr_simple_single2 = Number(month)+'/'+Number(day)+'('+week+')';

			if(obj.photo.length != 0){
				obj.thumbnail = obj.photo[0].photo;
				obj.copyright = obj.photo[0].copyright;
				obj.hasImage = true;
			}else{
				obj.thumbnail = '/special/common/images/no_image_800x448.jpg';
				obj.hasImage = false;
			}

			if(obj.channel.length != 0){
				obj.channelLogoUrl = obj.channel[0].channelLogoUrl;
				obj.channelName = obj.channel[0].channelName;
				obj.channelType = obj.channel[0].channelType;
				obj.channelId = obj.channel[0].channelId;
				obj.channelUrl = obj.channel[0].channelUrl;
				obj.digitalNo = obj.channel[0].digitalNo;
			}else{

			}

			result.push(obj);

		});//jQuery.each

	}).fail(function(data){  // Ajaxリクエストが失敗した時発動
		trace("おすすめAPI：検索 FAIL（jcom_api）");
		trace(data);
		////trace("APIエラー："+data.errorMassage);
		result = ["APIエラー："+data.errorMassage];
		message = ["APIエラー："+data.errorMassage];
		load_status = 2;

	}).always(function(data){  // Ajaxリクエストが成功・失敗どちらでも発動
		trace("おすすめAPI：検索 ALWAYS（jcom_api）");

		statusObj.api_type = 'recommend';


		if(callback != null) parent[callback](result,load_status,searchObj,statusObj);
	});//$.ajax({

  //*/

}

/*==============================================
	
	2019/6/21
	番組表API

	//	APIパラメータ
	var searchObj = {
			//areaId:12,	// エリアID　省略可
		//genreId:6,	// ジャンルID
		course:4,	// コースID　デフォルト（指定なし）、1(スタンダードプラス)、2(スタンダード)、3(コンパクト)、4(セレクトA)、5(セレクトB)、6(セレクトC)
		keyword:'宇宙',	//	検索ワード　APIではqueryで処理
		limit:10,	//	検索結果数
		//targetChannels:'0,1',		//	検索対象の放送波　0（CATV）、1（コミュチャン）、2（BS）、3（地デジ）カンマ区切りで複数設定可
		//serviceCode:'561_65406,560_65406',	
		queryTarget:0,	//	検索対象　0（すべて：初期設定）、1（番組名）、2（番組内容）　省略可
		queryType:0,	//	0（and検索）,　1（or検索）
		since:'201906210000',//	放送日（開始）
		until:'201906210000',//	放送日（終了）
		title:null,	//	検索時のタイトル、省略時はキーワードなどが適宜入る
		freeCaMode:null,　// CAモード	 デフォルトなし
		attr:null, // イベント属性 デフォルトなし
		image:0,	// 画像の有無 0（全て）,1（画像ありのみ）
		hasTag:0,	// 関連番組タグキーワード有無 0（全て）,1（タグありのみ）
		recommend:0,	// おすすめ番組フラグ 0（全て）,1（おすすめフラグ有りのみ）
		getImage:0,	// 画像取得 0（しない）,1（する）
		excludeTitle:'放送休止,インフォメーション', // 除外タイトル 番組タイトル部分一致で検索結果から除外するキーワードを指定する。カンマ区切りでor条件による複数指定可能。
		excludeServiceCode:'033_65406,034_65406', // 除外サービスコード 検索結果から除外するサービスコードを指定する。カンマ区切りで複数指定可能。
		excludeAttr:'4k,han,hua', // 除外イベント属性 検索結果から除外するイベント属性を指定する。カンマ区切りで複数指定可能。
		alignment:'new,feature,classic', // 番組マスタまとめフラグ 番組マスタ管理画面から登録した任意文字列のフラグを指定する。カンマ区切りで複数指定可能。
		alignment_title:'BTS特集と年末年始一挙放送と年末年始特番',// フラグ名を表示する際の文言、設定ない場合はフラグそのまま。

	};	
	
	//	制御用パラメータ
	var statusObj = {
		uid:0,	//	UID
		container:'.tv_program_list',		//番組表格納コンテナ（.付きの文字列で指定）デフォルト：.tv_program_list　省略可
		//container_parent:'.section_relation_program',	// [Bランクでは設定NG!] 検索結果がない場合やエラー発生時、非表示にするエリア（.付きの文字列で指定）デフォルト：.section_relation_program .content_program（Bランク用）
		ng_perfectmatching:false,	//	NGワードを完全一致とする（true）しない（false:デフォルト）　省略可
		ngwords:['スター・ウォーズ','科学'],	//	NGワード　配列で複数設定可能　省略可
		unuseNgWords:true,	//	NGワードをキャンセル（true）する、しない（false:デフォルト）　省略可
		research:false,	//	タグなどでの再検索の場合（true）通常検索の場合（false:デフォルト）　省略可
		nodata_hide:true,	//	検索結果がない場合やエラー発生時、エリアごと非表示にする（true:デフォルト）しない（false）　省略可
		displayN:10,	//	もっと見るボタンを表示。指定数ずつ番組を表示する　省略可
		callback:'searchProgramAPIComplete',	//	コールバック関数 デフォルト：searchProgramAPIComplete　省略可
		useRecommend:0,// おすすめ番組フラグを利用 0（しない：デフォルト）,1（する）
	};	
		
	//	データ呼び出し
	getJcomProgramList(searchObj,statusObj);
	
==============================================*/

var defaultNGwords = ['番組案内','番組ガイド','メガパックで配信中！'];
function getJcomProgramList(_searchObj,_statusObj){
	setCurrentTimeForAPI();
	var user_area_id = jQuery.cookie("area_id");
	if(user_area_id == undefined){
		user_area_id = 12;
	}
	var searchObj = {};
	var statusObj = {};
	

	//	2022/7/1追加
	if(_searchObj.course != null){
		searchObj.course =  _searchObj.course;
	}
	
	//	2021/3/29追加
	if(_searchObj.excludeTitle != null){
		searchObj.excludeTitle =  _searchObj.excludeTitle;
	}
	if(_searchObj.excludeServiceCode != null){
		searchObj.excludeServiceCode =  _searchObj.excludeServiceCode;
	}
	if(_searchObj.excludeAttr != null){
		searchObj.excludeAttr =  _searchObj.excludeAttr;
	}
	
	
	
	/* 番組マスタまとめフラグ */
	if(_searchObj.alignment != null){
		searchObj.alignment =  _searchObj.alignment;
	}
	if(_searchObj.alignment_title != null){
		searchObj.alignment_title =  _searchObj.alignment_title;
	}else{
		searchObj.alignment_title =  _searchObj.alignment;
	}
	
	//	2020/2/21追加
	if(_searchObj.freeCaMode != null){
		searchObj.freeCaMode =  _searchObj.freeCaMode;
	}
	if(_searchObj.attr != null){
		searchObj.attr =  _searchObj.attr;
	}
	if(_searchObj.image != null){
		searchObj.image =  _searchObj.image;
	}else{
		searchObj.image = 0;
	}
	if(_searchObj.hasTag != null){
		searchObj.hasTag =  _searchObj.hasTag;
	}
	if(_searchObj.recommend != null){
		searchObj.recommend =  _searchObj.recommend;
	}else{
		searchObj.recommend = 0;
	}
	if(_searchObj.getImage != null){
		searchObj.getImage = _searchObj.getImage;
		//if(_searchObj.getImage == 1) searchObj.image = 1;
	}else{
		searchObj.getImage = 1;//
	}
	
	if(_searchObj.adult != null){
		searchObj.adult =  _searchObj.adult;
	}else{
		searchObj.adult = 0;
	}
	if(_searchObj.since != null){
		searchObj.since =  _searchObj.since;
	}
	if(_searchObj.until != null){
		searchObj.until =  _searchObj.until;
	}

	if(_searchObj.attr != null){
		searchObj.attr =  _searchObj.attr;
	}

	if(_searchObj.areaId != null){
		searchObj.areaId =  _searchObj.areaId;
	}else{
		searchObj.areaId = user_area_id;
	}

	if(_searchObj.limit != null){
		searchObj.limit = Number(_searchObj.limit);
	}else{
		searchObj.limit = 100;
	}


	if(_searchObj.keyword != null){
    searchObj.query = _searchObj.keyword;
    searchObj.keyword = _searchObj.keyword;
	}
	
	if(_searchObj.genreId != null){
		if(_searchObj.genreId != 'null'){
			searchObj.genreId = encodeURI(_searchObj.genreId);
			if(searchObj.keyword == ""){
				searchObj.keyword = getProgramAPIGenrIDName(searchObj.genreId);
				//trace(searchObj.genreId+"  searchObj.keyword "+searchObj.keyword);
			};
		}
	}
	
	//	放送波の設定あればチャンネル設定無効
	if(_searchObj.targetChannels != null){
		//trace("_searchObj.targetChannels ある　"+_searchObj.targetChannels);
		searchObj.targetChannels = _searchObj.targetChannels;
		
		var targetChannels_arr = _searchObj.targetChannels.split(',');
		var wavename = "";
		if(1 < targetChannels_arr.length){
			
			for(var i=0;i<targetChannels_arr.length;i++){			
				if(i < 4){
					if(i != 0) wavename += " / ";
					wavename += getTargetChannelTypeByID(targetChannels_arr[i]);	
				}
			}//	for				
		}else{
			wavename = getTargetChannelTypeByID(_searchObj.targetChannels);
		}
		if(searchObj.keyword == "") searchObj.keyword = wavename;
	
	}else{
		if(_searchObj.serviceCode != null){
			trace("_searchObj.serviceCode ある　"+_searchObj.serviceCode);
			
			searchObj.serviceCode = _searchObj.serviceCode;
			var serviceCode_arr = _searchObj.serviceCode.split(',');
			var chname = "";
			if(1 < serviceCode_arr.length){
				
				for(var i=0;i<serviceCode_arr.length;i++){			
					if(i < 3){
						if(i != 0) chname += " / ";
						chname += getChannelNameByServiceCode(serviceCode_arr[i]);					
					}else if(i == 3){
						chname += " などのチャンネル";
					}
				}//	for				
			}else{
				chname = getChannelNameByServiceCode(_searchObj.serviceCode);
			}
			
			if(searchObj.keyword == "") searchObj.keyword = chname;
		}
	}
	
	if(_searchObj.queryType != null){
		searchObj.queryType = Number(_searchObj.queryType);
	}else{
		searchObj.queryType = 0;
	}
	
	if(_searchObj.queryTarget != null){
		searchObj.queryTarget = _searchObj.queryTarget;
	}else{
		searchObj.queryTarget = 0;
	}
	
	// _statusObjから制御用Objを抽出
	
	if(_statusObj.uid != null) statusObj.uid = _statusObj.uid;
	if(_statusObj.container != null){
		statusObj.container = _statusObj.container;
	}else{
		statusObj.container = '.tv_program_list';
	}
	if(_statusObj.container_parent != null){
		statusObj.container_parent = _statusObj.container_parent;
	}else{
		statusObj.container_parent = '.section_relation_program .content_program';
	}
	
	if(_statusObj.ng_perfectmatching != null){
		statusObj.ng_perfectmatching = _statusObj.ng_perfectmatching;
	}else{
		statusObj.ng_perfectmatching = false;
	}
	if(_statusObj.ngwords != null){
		if(isArray(_statusObj.ngwords)){
			statusObj.ngwords = _statusObj.ngwords.concat(defaultNGwords);
		}else{
			statusObj.ngwords = _statusObj.ngwords.split(',').concat(defaultNGwords);
		}
	}else{
		statusObj.ngwords = defaultNGwords;
	}
	if(_statusObj.unuseNgWords != null){
		if(_statusObj.unuseNgWords) statusObj.ngwords = [];
	}
	if(_statusObj.callback != null){
		statusObj.callback = _statusObj.callback;
	}else{
		statusObj.callback = "searchProgramAPIComplete";
	}
	if(_statusObj.research != null){
		statusObj.research = _statusObj.research;
	}else{
		statusObj.research = false;
	}
	if(_statusObj.nodata_hide != null){
		statusObj.nodata_hide = _statusObj.nodata_hide;
	}else{
		statusObj.nodata_hide = true;
	}
	
	if(_searchObj.title != null){
		searchObj.keyword = _searchObj.title;
	}
	
	if(searchObj.keyword == "") searchObj.keyword = "検索条件なし";
	
	if(_searchObj.since != null){
		searchObj.since = _searchObj.since;
	}
	if(_searchObj.until != null){
		searchObj.until = _searchObj.until;
	}
	
	//	もっと見るボタンでの表示数
	if(_statusObj.displayN != null){
		statusObj.displayN = _statusObj.displayN;
	}
	
	//	もっと見るボタンでの表示数
	if(_statusObj.useRecommend != null){
		statusObj.useRecommend = _statusObj.useRecommend;
	}else{
		statusObj.useRecommend = 0;
	}
	
	// コールバックパラメータ名の指定
	jsonpCallbackUID ++;
	statusObj.jsonpCallback = 'search_program'+jsonpCallbackUID;

	/**/
	if(statusObj.uid == 0){
		trace("------------------------　番組表　"+statusObj.uid)
		trace(searchObj);
		trace(statusObj);
		trace(statusObj.container);
	}
	//output(searchObj);
	//output(statusObj);
	/**/
	searchJCOMProgramAPI(searchObj,statusObj);
}

function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}
/*--------------------------------------------------------------
	番組表API：検索
--------------------------------------------------------------*/
function searchJCOMProgramAPI(searchObj,statusObj){
	//trace('番組表API（jcom_api）：検索');
	var result = [];
	var message = "";
	var dataType = "jsonp";
	var jsonpCallback = statusObj.jsonpCallback;
	var url = "https://tvguide.myjcom.jp/api/getProgramInfo/?";
	var getImage = searchObj.getImage;

	// trace(searchObj);
	// trace(statusObj);

	if(isMyjcom){
		url += "callback=?"+getAPIRequestQuery(searchObj,false);
		//trace("番組表API（jcom_api）：myjcom "+url);
	}else{
		var param = getAPIRequestQuery(searchObj,true);
		url = api_php_path+'wrp='+jsonpCallback+'&url='+url+param;
		url = location.protocol+"//"+location.host+url;	// ローカルからアクセスできるよう絶対パスで指定
		//trace("番組表API（jcom_api）：other "+url);
	}

	var callback = statusObj.callback;
	var load_status;

	$.ajax({
		url: url,
		type:'POST',
		dataType: dataType,
		jsonpCallback: jsonpCallback
	}).done(function(data){ // Ajaxリクエストが成功した時発動
		//trace("番組表API（jcom_api）：DONE");
		//trace(data);

		if(data === undefined) {
			result = ['検索失敗（data === undefined）'];    
			load_status = 2;
			trace("検索失敗（番組表API（jcom_api）：DONE）");
			return;
		}
		/**/
		// trace("======================");
		// trace(data);
		//*/
		load_status = data.status;
		if(load_status != 0) return;
		var pdata = data.programs;
		//trace(pdata);

		//	トータル番組数
		statusObj.totalCount = data.totalCount;

		//	録画予約が可能な日数
		var recPossibleDate = getDateAfterXdays(new Date(),8);

		if(pdata.length != 0){
			var count = 0;
			var limit = statusObj.limit;
			var ngwords = statusObj.ngwords;
			var ng_perfectmatching = statusObj.ng_perfectmatching;

			//      var nowtime = new Date();
			//      nowYear = formatDate(nowtime, 'YYYY');
			//      nowMonth = formatDate(nowtime, 'MM');
			//      nowDay = formatDate(nowtime, 'DD');

			//	APIの戻り値をNGワード処理して検索結果データを作成
			jQuery.each(pdata, function(key, val){
				if(count == limit)  return true;
				var title = val.title;
				var hasNG = hasNGwords(title,ngwords,ng_perfectmatching);						
				if(hasNG) return true;

				var date = val.startTime.slice(0,4) + '/' + val.startTime.slice(4,6) + '/' + val.startTime.slice(6,8); // 放送日yyyy/mm/ddに
				var dateObj = new Date(date);
				var month = formatDate(dateObj, 'MM');
				var day = formatDate(dateObj, 'DD');
				var week = formatDate(dateObj, 'W');

				var datestr = month+'月'+day+'日（'+week+'）';
				var datestr_single = Number(month)+'月'+Number(day)+'日（'+week+'）';
				var datestr_simple = month+'/'+day+'（'+week+'）';
				var datestr_simple_single = Number(month)+'/'+Number(day)+'（'+week+'）';
				var datestr_simple_single2 = Number(month)+'/'+Number(day)+'('+week+')';

				var startTime_org = val.startTime;
				var endTime_org = val.endTime;
				var programId = val.programId;
				var startTime = val.startTime.slice(8,10) + ':' + val.startTime.slice(10,12);
				var endTime = val.endTime.slice(8,10) + ':' + val.endTime.slice(10,12);
				var channel_icon_id = channel_icon[val.channelName];

				// NO ON AIR
				var onairTimeObj = checkThisProgramNowOnair(dateObj,val.startTime,val.endTime);
				var nowonair = onairTimeObj.nowonair;
				var todayonair = onairTimeObj.todayonair;

				// 番組ステータス
				var attr = val.attr;
				// var live = (-1 !== attr.indexOf('live'));
				// var first = (-1 !== attr.indexOf('first'));
				// var repeat = (-1 !== attr.indexOf('rep'));
				// var duo = (-1 !== attr.indexOf('duo'));
				// var free = (-1 !== attr.indexOf('free'));
				var live   = attr.includes('live');
				var first  = attr.includes('first');
				var repeat = attr.includes('rep');
				var duo    = attr.includes('duo');
				var free   = attr.includes('free');

				var obj = {
					programId:programId,
					date:datestr,
					datestr:date,
					datestr_single:datestr_single,
					datestr_simple:datestr_simple,
					datestr_simple_single:datestr_simple_single,
					datestr_simple_single2:datestr_simple_single2,
					startTime_org:val.startTime,
					endTime_org :val.endTime,
					startTime:startTime,
					endTime:endTime,
					channelName:val.channelName,
					channelType:val.channelType,
					channelLogoUrl:val.channelLogoUrl,
					serviceCode:val.serviceCode,
					eventId:val.eventId,
					rec:val.rec,
					programDate:val.programDate,
					url:val.url,
					title:title,
					nowonair:nowonair,
					todayonair:todayonair,
					airTime:val.airTime,
					attr:attr,
					live:live,
					first:first,
					repeat:repeat,
					duo:duo,
					free:free,
					channelNo:val.channelNo,
					//						genreIds:val.genreIds,
					//photo:val.photo,
					summary:val.summary,
					tags:val.tags,
					genreIds:val.genreIds,
					isRecommend:val.isRecommend,
					isFreeCa:val.isFreeCa,
					minogashiFlg:val.minogashiFlg,
					course:val.course,
				};

				if(getImage == 1 && val.photo.length != 0){
					obj.photo = 'https://tvguide.myjcom.jp/'+val.photo[0].photo;
					obj.copyright = val.photo[0].copyright;
					obj.hasPhoto = true;
				}else{
					obj.photo = '/special/common/images/no_image_800x448.jpg';
					obj.copyright = '';
					obj.hasPhoto = false;
				}

				//	予約可能日程かチェック   
				if(recPossibleDate <= new Date(date)){
					obj.rec = false;
				}else{
					obj.rec = true;
				}

				result.push(obj);
				count++;
			});//jQuery.each

			// trace("追加したresult");
			// trace(result);

		}else{
			//    検索結果なし
			result = ['検索結果はありません'];    
			load_status = 1;
		}
	}).fail(function(data){  // Ajaxリクエストが失敗した時発動
		result = ["APIエラー："+data.errorMassage];    
		load_status = 2;
		trace("番組表API（jcom_api）：FAIL "+result);

	}).always(function(data){  // Ajaxリクエストが成功・失敗どちらでも発動
		//trace("番組表API（jcom_api）：ALWAYS");
		/**
		trace(searchObj);
		trace(statusObj);
		trace(data);
		//*/

		statusObj.api_type = 'program';
		searchObj.searchBtnURL = getSearchProgramBtnURL(searchObj);
		if(callback != null) parent[callback](result,load_status,searchObj,statusObj);
	});

}

/*--------------------------------------------------------------
	配列に含まれるかチェック
--------------------------------------------------------------*/
function checkIncludedInArr(arr,val){
	//arr.indexOf(val);
	arr.includes(val);
}

/*--------------------------------------------------------------
	番組表API：NGワード
--------------------------------------------------------------*/
//	配列に値がふくまれるかチェック
function hasNGwords(val,arr,perfectmatching){
	var flag = false;
	var len = arr.length;
	if(perfectmatching){
		for(var i=0;i<len;i++){
			if(val == arr[i]){
				flag = true;
				continue;
			}
		}//	for
	}else{
		// for(var i=0;i<len;i++){
		// 	if (val.indexOf(arr[i]) != -1) {
		// 		flag = true;
		// 		continue;
		// 	}
		// }//	for
		for (let i = 0; i < len; i++) {
			if (val.includes(arr[i])) {
				flag = true;
				continue;
			}
		}
	}
	return flag;
}
/*--------------------------------------------------------------
	番組表API：NGジャンルID
--------------------------------------------------------------*/
//	配列に値がふくまれるかチェック
function hasNGGenreIDCheck(val,ng_genreid){
	//trace("------------------------------------")
	//	val	 //	32
	//	ng	 //	31,60,6F
	
	
	var flag = false;
	var count = 0;
	
	var len = ng_genreid.length;
	
	//trace(val+" / "+ng_genreid);
	
	for(var i=0;i<len;i++){
		
		var val_len = val.length;
		
		for(var v=0;v<val_len;v++){
			var id = val[v];
			//trace(id+" : "+ng_genreid[i]);
			
			if(id == ng_genreid[i]){
				flag = true;
				continue;
			}
		}//	for
		
	}//	for
	

	return flag;
}

/*--------------------------------------------------------------
	番組表API：もっとみるボタンのURL
	2020/1/22
--------------------------------------------------------------*/
function getSearchProgramBtnURL(searchObj){
	var query = (searchObj.query) ? "keyword="+searchObj.query : "";
	var genreId = (searchObj.genreId) ? "&genre="+searchObj.genreId : "";
	var queryTypeID = (searchObj.queryType) ? searchObj.queryType : "";
	var queryType = "";
	
	if(queryTypeID == 1){
		queryType = "&keywordType=or";
	}
	
	var targetChannels = "";
	var channel = "";
	
	//trace("searchObj.targetChannels "+searchObj.targetChannels);
	
	if(searchObj.targetChannels != null){
		targetChannels = getTargetChannelsQuery(searchObj.targetChannels);
	}else if(searchObj.serviceCode != null){
		channel = '&channel='+searchObj.serviceCode;
	}
	
	var keywordType = "";
	if(searchObj.queryType){
		keywordType = (searchObj.queryType == 0) ? "&keywordType=and" : "&keywordType=or";
	}
	
	var queryTarget = "";
	if(searchObj.queryTarget){
		if(searchObj.queryTarget == 1){
			queryTarget = '&keywordTarget=title';
		}else if(searchObj.queryTarget == 2){
			queryTarget = '&keywordTarget=detail';
		}
	}
	
	var url = "https://tvguide.myjcom.jp/search/event/?"+query+targetChannels+genreId+channel+keywordType+queryTarget;
	//if(isStage) url = "https://stage-tvguide.myjcom.jp/search/event/?"+query+targetChannels+genreId+channel+keywordType;

	return encodeURI(url);
}


/*==============================================
	
	2019/10/28
	オンデマンドAPI（VOD）
	
	//	APIパラメータ
	var searchObj = {
		category:'jmc/v200904/anime',
		//keyword:'宇宙',	//	検索ワード	半角スペース区切りで複数設定可能
		limit:10,	//	検索結果数　50以下
		flagInitialEpisodeOnly:1,	//	シリーズの表示　0（すべて表示：初期設定）、1（シリーズ作品単位、第一回のエピソードのみ表示）
		kindHishinbi:0,	//	配信日種別　0（すべて表示：初期設定）、1（新着限定）、2（まもなく配信）、3（もうすぐ終了）
		flagOr:0,	//	検索方法　0（and検索：初期設定）、1（or検索）
		flagMuryo:0,	//無料作品　0（全ての作品：初期設定）、1（無料作品）
		page:pageID,	//出力ページ数
		sort:3,	// ソート　1: 配信日(昇順)　2: 配信日(降順)　3: 作品名(昇順)　4: 作品名(降順)
		r18:0	//R18　0（非表示：初期設定）、1（表示
	};
	
	//	制御用パラメータ
	var statusObj = {
		uid:0,	//	UID
		//apiURL: 'https://adult-jvod.myjcom.jp/retrieveadult.jsonp',// アダルト用リクエストURL
		//apiURL: 'https://jvod.myjcom.jp/retrieve2.jsonp',// テスト用リクエストURL
		container:$('.ondemand_api_container'),		//番組表格納コンテナ　デフォルト　.ondemand_api_container　省略可
		ng_perfectmatching:false,	//	NGワードを完全一致とする（true）しない（false:デフォルト）　省略可
		ngwords:['宇宙'],	//	NGワード　配列で複数設定可能　省略可
		unuseNgWords:true,	//	NGワードをキャンセル（true）する、しない（false:デフォルト）　省略可
		callback:'searchOndemandAPICpmplete'	//	コールバック関数　デフォルト　searchOndemandAPICpmplete　省略可
	};	
		
	//	データ呼び出し
	getJcomOndemandList(searchObj,statusObj);
	
==============================================*/
function getJcomOndemandList(_searchObj,_statusObj){
	setCurrentTimeForAPI();
	var requestURL;
	var statusObj = {};
	var limit,num;
	var ngwords,ng_perfectmatching,unuseNgWords;
	
	//	NGワードを使わない
	if(_statusObj.unuseNgWords != null){
		unuseNgWords = _statusObj.unuseNgWords;
	}else{
		unuseNgWords = false;
	}
	
	if(_searchObj.limit == null){
		_searchObj.limit = 10;
	}
	
	//	NGワード
	if(!unuseNgWords){
		if(_statusObj.ngwords != null){
			ngwords = _statusObj.ngwords.concat(defaultNGwords);
		}else{
			ngwords = defaultNGwords;
		}
		num = 50;
		limit = _searchObj.limit;
	}else{
		ngwords = [];
		limit = num = _searchObj.limit;
	}
	
	if(50 <= num) num = 50;　//　検索可能なMAXは50まで。51からエラー
	
	//	利用するAPIのURL
	if(_statusObj.apiURL != null){
		statusObj.apiURL = _statusObj.apiURL;
	}else{
		statusObj.apiURL = "https://jvod.myjcom.jp/retrieve.jsonp";
	}
	
	// _searchObjからリクエストURLを作成
	var apiURL = statusObj.apiURL;//"https://jvod.myjcom.jp/retrieve2.jsonp";// "https://jvod.myjcom.jp/retrieve.jsonp";
	requestURL = apiURL+"?num="+num;
	
	if(_searchObj.category != null){
		requestURL += '&category='+_searchObj.category;
	}
	if(_searchObj.page != null){
		requestURL += '&page='+_searchObj.page;
	}
	if(_searchObj.keyword != null){
		requestURL += '&keyword='+_searchObj.keyword;
	}
	if(_searchObj.sort != null){
		requestURL += '&sort='+_searchObj.sort;
	}else{
		requestURL += '&sort=1';
	}
	if(_searchObj.flagSeries != null){
		requestURL += '&flagSeries='+_searchObj.flagSeries;
	}else{
		requestURL += '&flagSeries=0';
	}
	if(_searchObj.flagInitialEpisodeOnly != null){
		requestURL += '&flagInitialEpisodeOnly='+_searchObj.flagInitialEpisodeOnly;
	}else{
		requestURL += '&flagInitialEpisodeOnly=0';
	}
	if(_searchObj.kindHishinbi != null){
		requestURL += '&kindHishinbi='+_searchObj.kindHishinbi;
	}else{
		requestURL += '&kindHishinbi=0';
	}
	if(_searchObj.flagOr != null){
		requestURL += '&flagOr='+_searchObj.flagOr;
	}else{
		requestURL += '&flagOr=0';
	}
	if(_searchObj.flagMuryo != null){
		requestURL += '&flagMuryo='+_searchObj.flagMuryo;
	}else{
		requestURL += '&flagMuryo=0';
	}
	
		//	アセットIDでの検索時はその他項目は不要
	if(_searchObj.assetId != null){
		requestURL = apiURL+'?assetId='+_searchObj.assetId;
	}
	if(_searchObj.r18 != null){
		requestURL += '&r18='+_searchObj.r18;
	}else{
		requestURL += '&r18=0';
	}
	
	// _statusObjから制御用Objを抽出
	
	if(_statusObj.uid != null) statusObj.uid = _statusObj.uid;
	if(_statusObj.container != null){
		statusObj.container = _statusObj.container;
	}else{
		statusObj.container = '.ondemand_api_container';
	}
	if(_statusObj.container_parent != null){
		statusObj.container_parent = _statusObj.container_parent;
	}
	if(_statusObj.ng_perfectmatching != null){
		ng_perfectmatching = _statusObj.ng_perfectmatching;
	}else{
		ng_perfectmatching = false;
	}
	if(_statusObj.callback != null){
		statusObj.callback = _statusObj.callback;
	}else{
		statusObj.callback = "searchOndemandAPICpmplete";
	}
		
	var result = [];
	var load_status;
	var count = 0;
	
	/**/
	trace("------------------------　VOD（jcom_api）")
	trace(_searchObj);
	trace(statusObj);
	trace(requestURL);
	/**/

	
	$.ajax({
		url: requestURL,
		type:'GET',
		dataType: 'jsonp'
	}).done(function(data) {
		trace("VOD LOADED SUCCESS（jcom_api）");
		trace(data);
		if(data.status == -1) return;
		var resultN = data.total_count;
		statusObj.total_count = data.total_count;
		
		if(resultN != 0){
			//trace("検索結果あり "+resultN);		
			load_status = 0;
			var len = data.result.length;
			for(var i=0;i<len;i++){        
				if(count == limit)  continue;
				var title = data.result[i].Title;
				var hasNG = hasNGwords(title,ngwords,ng_perfectmatching);		
				
				if(hasNG) continue;
				result.push(data.result[i]);
				count++;
			}//    for
	
		}else{
			//trace("結果なしは枠ごと非表示");
			result = [];
			statusObj.searchBtnURL = vodsite;
			load_status = 1;
		}
	}).fail(function(data) {
		//trace("読み込み失敗（jcom_api）");
		//trace(data);
		result = [];
		statusObj.searchBtnURL = vodsite;
		load_status = 2;
	}).always(function(data) {
		//trace("処理完了（jcom_api）　"+load_status);
		
		if(result.length == 0){
			sload_statustatus = 1;
			statusObj.searchBtnURL = vodsite;
		}else{
			statusObj.searchBtnURL = getMoreOndemandBtnURL(_searchObj);
		}
		
		statusObj.api_type = 'ondemand';
		var callback = statusObj.callback;
		if(callback != null) parent[callback](result,load_status,requestURL,statusObj,_searchObj);
	});
}

/*--------------------------------------------------------------
	オンデマンドAPI：もっとみるボタンのURL
--------------------------------------------------------------*/
var vodsite = 'https://jvod.myjcom.jp/';
var isMoreOndemandBtn = true;
function getMoreOndemandBtnURL(searchObj){
	trace("●オンデマンドAPI：もっとみるボタンのURL ");
	var keyword = (searchObj.keyword) ? searchObj.keyword : "";
	var category = (searchObj.category) ? getOndemandCategoryQuery(searchObj.category) : '&genre=0&subgenre=none';
	var Haishinbi = (searchObj.kindHishinbi) ? searchObj.kindHishinbi : 0;
	var Haishinbi = (searchObj.kindHishinbi) ? searchObj.kindHishinbi : 0;
	
	//if(isStage) vodsite = 'https://stg-jvod.myjcom.jp/';
	var url = vodsite+"kensaku/search?&keyword="+keyword+category+"&Haishinbi="+Haishinbi+"&Device=0&Syllabary=0&categorysubcheck=&sub=検索";;
	
	// VODアプリ分岐 2019/12/09

	if(typeof useJCOMLINK !== 'undefined'){
		trace("useJCOMLINK ["+useJCOMLINK+"]  ");
		if(useJCOMLINK == 'true'){
			url = 'https://linkvod.myjcom.jp/search?q='+keyword;
		}else{
			url = 'https://vod.myjcom.jp/video';
		}
	}else{
		trace("useJCOMLINK なし");
	}
	
	return encodeURI(url);
}


/*==============================================
	
	2019/10/28
	オンデマンドAPI（VOD）カラオケ
	
	//	APIパラメータ
	var searchObj = {
		singer:'',	// アーティスト名
		title:'',	// 楽曲名
		startPhrase:'',	// 歌い出し
		musicID:'',	// 楽曲の番号
		initialTitle:'',	// 楽曲名の先頭文字（ひらがな）
		initialSinger:'',	// アーティスト名の先頭文字（ひらがな）
		generation:'',	// 年代 4桁の数字2個を-でつなげたもの　例 2000-2010
		release_month:'',	// 配信月　例 201908
		order:'',	// 指定なし or 1：「アーティスト名」 昇順　2：「楽曲名」 昇順　3:「リリース日」 降順　4:「AssetId」 昇順
		LicensingmonthStart:'1',	// 配信開始日
		LicensingmonthEnd:'50',	// 配信終了日
		all:'u',	// 検索用文字列（楽曲名、アーティスト名の双方のOR検索を行う場合に利用する文字列
		page:'',	// 出力結果のページを指定する　数字（1以上、1000以下）
		num:'',	// １ページ当たりの件数を指定する　数字（1以上、50以下）
		ie:'',	// ⼊⼒キーワードの⽂字コード　ie：u: UTF-8　ie：s: Shift-JIS　ie：e: EUC-JP 
		callback:'',	// JSONP のコールバック関数名　callback：関数名（例：callback：response_jcomvod）使⽤可能⽂字は、英数字およびアンダースコア。
	};
	
	//	制御用パラメータ
	var statusObj = {
		uid:0,	//	UID
		apiURL: 'https://jvod.myjcom.jp/retrievekaraoke.jsonp',// カラオケ用リクエストURL
		container:$('.karaoke_api_container'),		//格納コンテナ　デフォルト　.karaoke_api_container　省略可
		callback:'searchOndemandKaraokeAPICpmplete'	//	コールバック関数　デフォルト　searchOndemandKaraokeAPICpmplete　省略可
	};	
		
	//	データ呼び出し
	getJcomOndemandKaraokeList(searchObj,statusObj);
	
==============================================*/
function getJcomOndemandKaraokeList(_searchObj,_statusObj){
	setCurrentTimeForAPI();
	var requestURL;
	var statusObj = {};
	var limit,num;

	if(_searchObj.num == null){
		_searchObj.num = 10;
	}

	if(50 <= num) num = 50;　//　検索可能なMAXは50まで。51からエラー
	
	//	利用するAPIのURL
	if(_statusObj.apiURL != null){
		statusObj.apiURL = _statusObj.apiURL;
	}else{
		statusObj.apiURL = "https://jvod.myjcom.jp/retrievekaraoke.jsonp";
	}
	
	// _searchObjからリクエストURLを作成
	var apiURL = statusObj.apiURL;//"https://jvod.myjcom.jp/retrieve2.jsonp";// "https://jvod.myjcom.jp/retrieve.jsonp";
	requestURL = apiURL+"?num="+num;
	
	if(_searchObj.singer != null){
		requestURL += '&singer='+_searchObj.singer;
	}
	if(_searchObj.title != null){
		requestURL += '&title='+_searchObj.title;
	}
	if(_searchObj.startPhrase != null){
		requestURL += '&startPhrase='+_searchObj.startPhrase;
	}
	if(_searchObj.musicID != null){
		requestURL += '&musicID='+_searchObj.musicID;
	}
	if(_searchObj.initialTitle != null){
		requestURL += '&initialTitle='+_searchObj.initialTitle;
	}
	if(_searchObj.initialSinger != null){
		requestURL += '&initialSinger='+_searchObj.initialSinger;
	}
	if(_searchObj.generation != null){
		requestURL += '&generation='+_searchObj.generation;
	}
	if(_searchObj.release_month != null){
		requestURL += '&release_month='+_searchObj.release_month;
	}
	if(_searchObj.order != null){
		requestURL += '&order='+_searchObj.order;
	}
	if(_searchObj.LicensingmonthStart != null){
		requestURL += '&LicensingmonthStart='+_searchObj.LicensingmonthStart;
	}
	if(_searchObj.LicensingmonthEnd != null){
		requestURL += '&LicensingmonthEnd='+_searchObj.LicensingmonthEnd;
	}
	if(_searchObj.all != null){
		requestURL += '&all='+_searchObj.all;
	}
	if(_searchObj.page != null){
		requestURL += '&page='+_searchObj.page;
	}
	if(_searchObj.num != null){
		requestURL += '&num='+_searchObj.num;
	}
	if(_searchObj.ie != null){
		requestURL += '&ie='+_searchObj.ie;
	}
	if(_searchObj.callback != null){
		requestURL += '&callback='+_searchObj.callback;
	}

	// _statusObjから制御用Objを抽出
	
	if(_statusObj.uid != null) statusObj.uid = _statusObj.uid;
	if(_statusObj.container != null){
		statusObj.container = _statusObj.container;
	}else{
		statusObj.container = '.karaoke_api_container';
	}
	if(_statusObj.ng_perfectmatching != null){
		ng_perfectmatching = _statusObj.ng_perfectmatching;
	}else{
		ng_perfectmatching = false;
	}
	if(_statusObj.callback != null){
		statusObj.callback = _statusObj.callback;
	}else{
		statusObj.callback = "searchOndemandAPICpmplete";
	}
		
	var result = [];
	var load_status;
	var count = 0;
	
	/**/
	trace("------------------------　VOD KARAOKE（jcom_api）")
	trace(_searchObj);
	trace(statusObj);
	trace(requestURL);
	/**/

	
	$.ajax({
		url: requestURL,
		type:'GET',
		dataType: 'jsonp'
	}).done(function(data) {
		trace("VOD KARAOKE LOADED SUCCESS（jcom_api）");
	
		if(data.status == -1) return;
		
		var resultN = data.total_count;
		statusObj.total_count = data.total_count;
		if(resultN != 0){
			load_status = 0;
			var len = data.result.length;
			for(var i=0;i<len;i++){        
				result.push(data.result[i]);
				count++;
			}//    for
	
		}else{
			//trace("結果なしは枠ごと非表示");
			result = [];
			load_status = 1;
		}
	}).fail(function(data) {
		//trace("読み込み失敗（jcom_api）");
		//trace(data);
		result = [];
		load_status = 2;
	}).always(function(data) {
		//trace("処理完了（jcom_api）　"+load_status);
		
		if(result.length == 0){
			load_status = 1;
		}
		
		var callback = statusObj.callback;
		statusObj.api_type = 'ondemand_karaoke';
		if(callback != null) parent[callback](result,load_status,requestURL,statusObj,_searchObj);
	});
}

/*--------------------------------------------------------------

	2017/11/9
	utils

--------------------------------------------------------------*/
//	テスト出力用
var outputHTML = '';
function output(obj){
	var html = outputHTML+"<br />------------------------<br />";
	for (var key in obj){
		html += key + " = " + obj[key] + "<br />";
    }
	outputHTML += html;
	$('.output').html(html);
}

//	dateObjから、addDays日後の日付を取得
function getDateAfterXdays(dateObj, addDays) {
	var dt = dateObj;
	var baseSec = dt.getTime();
	var addSec = addDays * 86400000;//日数 * 1日のミリ秒数
	var targetSec = baseSec + addSec;
	dt.setTime(targetSec);
	return dt;
}
// 全角、半角の混じった文字列をバイト数でトリミング
function trimTextByBite(str,trimNum) {
	////trace("trimTextByBite--------------------- "+str);
	var afterTxt = '&hellip;';
	var result;
	var txt ="";
	var textLength = 1;
    var r = 0; 
    for (var i = 0; i < str.length; i++) { 
        var c = str.charCodeAt(i); 
        if ( (c >= 0x0 && c < 0x81) || (c == 0xf8f0) || (c >= 0xff61 && c < 0xffa0) || (c >= 0xf8f1 && c < 0xf8f4)) { 
            r += 1; 
        } else { 
            r += 2; 
        } 
		if(r < trimNum){
			textLength ++;
		}
    } 
	var textTrim = str.substr(0,(textLength));
	if(trimNum <= (textLength*2)) {
		result = textTrim + afterTxt;
	}else{
		result = str;
	}
    return result; 
} 



/*=============================================

	オンデマンドリンクの遷移　2019/11/1
	
=============================================*/

function addJcomVODLnkEvent(){
	
	$('.section').off('click', '.vodapplink').on('click', '.vodapplink', function(e){
		e.preventDefault();
	
		var assetID = $(this).find('a').attr('href');
	
		if (checkNowDeviceOS() === 'other') {
			jumpToJcomVODURL(assetID);
		} else {
			setJcomVODDetails(assetID);
		}
		return false;
	});

	$('.section').on({"mouseenter": function(){
		$(this).addClass('hover');
	},"mouseleave": function(){
		$(this).removeClass('hover');
	}}, ".vodlinkarea");

}

//アプリ詳細リンクモーダル
function setJCOMVODAppDetailModal(appUrl, storeUrl){
	trace("setJCOMVODAppDetailModal アプリ詳細リンクモーダル ");
	clickModalname = "modal_appdetail";
	$('.modal_appdetail .hasdata').show();
	$('.modal_appdetail .nodata').hide();
	
	$('.modal_appdetail .download a').attr('href',storeUrl);
	$('.modal_appdetail .openapp a').attr('href',appUrl);
	
	modalname = clickModalname;
	changeModalDetail();
	showModal();
}

// アプリがインストール済なら詳細画面へ遷移、インストール未ならストアに遷移
function setJcomVODDetails(assetId){
	trace("details "+assetId);
	var os = checkNowDeviceOS();
	var query = assetId+"";
	
	if (os === 'ios'){
		if(getiOSVer() != 9){
			setJCOMVODAppDetailModal("jcomapp://jp.co.jcom.JcomApp/webview/contents/" + query, 'http://itunes.apple.com/jp/app/id449811083?mt=8');
		}else{
			setJCOMVODAppDetailModal("jcomapp://jp.co.jcom.JcomApp/webview/contents/" + query, 'http://itunes.apple.com/jp/app/id449811083?mt=8');
		}
		modalHasData = true;
	}else if(os === 'android'){
		// AndroidのChomeの時はインテント起動
		if (isNowBrowsers(['chrome'])){
			location.href = "intent://jp.co.jcom.JcomApp/webview/contents/" + assetId + "#Intent;scheme=jcomapp;package=jp.co.jcom.JcomApp;end";
		}else{
			launchJcomVODApp("jcomapp://jp.co.jcom.JcomApp/webview/contents/" + assetId, 'market://details?id=jp.co.jcom.JcomApp');
		}
	}else{
		jumpToJcomVODURL(assetId);
	}
}
function jumpToJcomVODURL(assetId){
	var url = 'https://jvod.myjcom.jp/detail/'+assetId;
	window.open( url, "_blank" );
}

//	iOS
function launchJcomVODApp(appUrl, storeUrl){
	var iframe = document.createElement('iframe');
	iframe.style.visibility = "hidden";
	iframe.src = appUrl;
	document.body.appendChild(iframe);

	var time = (new Date()).getTime();

	setTimeout(function(){
		var now = (new Date()).getTime();
		document.body.removeChild(iframe);
		if((now-time)>400) {
			return;
		}
		document.location = storeUrl;
	}, 100);
}
// ブラウザ判定
var isNowBrowsers = function(browsers){
	var thusBrowser = getBrowser();
	for(var i=0; i<browsers.length; i++){
		if(browsers[i] == thusBrowser){
			return true;
			exit;
		}
	}
	return false;
};

function checkNowDeviceOS(){
		// var userAgent = window.navigator.userAgent.toLowerCase();
		// os = null;
		// if(userAgent.indexOf('iphone') != -1){
		// 	os = 'ios';
		// }else if(userAgent.indexOf('ipad') != -1){
		// 	os = 'ios';
		// }else if(userAgent.indexOf('ipod') != -1){
		// 	os = 'ios';
		// }else if(userAgent.indexOf('android') != -1){
		// 	os = 'android';
		// }else{
		// 	os = 'other';
		// }
		var ua = navigator.userAgent.toLowerCase();
		var os = 'other';

		if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
			os = 'ios';
		} else if (ua.includes('android')) {
			os = 'android';
		}
		return os;
	}
	


/*==============================================
	
	2021/11/16
	番組表マスターAPIの複数検索
	
/*==============================================*/
var masterApiSearchList;
var masterApiSearchResultList = [];
var masterApiStatusObj
var masterApiLoadedNum = 0;
var masterApiSearchCompleteCallback;
var masterApiSearchStatusList = [];
var masterApiMultiObjList = [];
var masterApiMultiObjUid = 0;

function getJcomProgramMasterListMultiSearch(searchList,statusObj){
	trace("================================== 番組表マスターAPIの複数検索 "+statusObj.callback);
//	masterApiLoadedNum = 0;
//	masterApiSearchList = searchList;
//	masterApiStatusObj = statusObj;
//	masterApiSearchCompleteCallback = statusObj.callback;
//	statusObj.callback = "jcomProgramMasterMultiSearchLoaded";
	
	
	var masterApiMultiObj = {};
	masterApiMultiObj.loadNum = 0;
	masterApiMultiObj.loadTital = searchList.length;
	masterApiMultiObj.searchList = searchList;
	masterApiMultiObj.statusList = [];
	masterApiMultiObj.statusObj = statusObj;
	masterApiMultiObj.callback = statusObj.callback;
	masterApiMultiObj.resultList = [];
	masterApiMultiObjList.push(masterApiMultiObj);
	masterApiMultiObj.masterUid = masterApiMultiObjUid;
	
	statusObj.callback = "jcomProgramMasterMultiSearchLoaded";
	statusObj.masterUid = masterApiMultiObjUid;
	masterApiMultiObjUid++;
	
	var len = searchList.length;
	for(var i=0;i<len;i++){
		var searchObj = searchList[i];
		getJcomProgramMasterList(searchObj,statusObj);
	}//	for
	
}

//	読み込み完了
function jcomProgramMasterMultiSearchLoaded(result,status,searchObj,statusObj){
	trace("番組表マスターAPIの複数検索：読み込み完了 "+status);
	trace(searchObj);
	trace(result);
	
	var len = masterApiMultiObjList.length;
	for(var i=0;i<len;i++){
		var masterApiMultiObj = masterApiMultiObjList[i];

		if(statusObj.masterUid == masterApiMultiObj.masterUid){
			masterApiMultiObj.loadNum ++;
			masterApiMultiObj.statusList.push(status);

			if(status == 0){
				var resultN = result.length;
				for(var v=0;v<resultN;v++){
					var obj = result[v];
					obj.alignment = searchObj.alignment;
					masterApiMultiObj.resultList.push(obj);
				}//	for
			}

			if(masterApiMultiObj.loadNum == masterApiMultiObj.loadTital){
				jcomProgramMasterMultiSearchLoadedComplete(masterApiMultiObj);
			}
		}
	}//	for

}//

//	全て読み込み完了
function jcomProgramMasterMultiSearchLoadedComplete(masterApiMultiObj){
	trace("番組表マスターAPIの複数検索：全て読み込み完了 ");

	var result;
	var status;
	
	if(masterApiMultiObj.resultList.length != 0){
		
		trace("元");
		trace(masterApiMultiObj.resultList);
		//	重複削除
		var list = filterUniqueItemsById(masterApiMultiObj.resultList);
//		trace("重複削除");
//		trace(list);
		
		// 放送日順に並べ替え
		list.sort(function(a,b) {
			return (new Date(a.next_dateObj) > new Date(b.next_dateObj) ? 1 : -1);
		});
		status = 0;
		result = list;
		
	}else{
		status = 1;
		result = "番組情報はありませんでした。";
	}
	
	var searchObj = masterApiMultiObj.searchList;//masterApiSearchList;
	var statusObj = masterApiMultiObj.statusObj;//masterApiStatusObj;
	var callback_func = masterApiMultiObj.callback;
	statusObj.api_type = 'master';
	
	if(callback_func != null) parent[callback_func](result,status,searchObj,statusObj);
}//

//	重複を削除
function filterUniqueItemsById (array) {
  // idを集約した配列を作成
  const itemIds = array.map(function(item) {
    return item.programId;
  });
  // 
  return array.filter(function(item, index) {
    //return itemIds.indexOf(item.programId) === index;
	return itemIds.findIndex(id => id === item.programId) === index;
  });
}


/*==============================================
	
	2021/3/23
	番組表マスターAPI
/**
	//	APIパラメータ
	var searchObj = {
			//areaId:12,	// エリアID　省略可
			genreId:6,	// ジャンルID
			//keyword:'タモリ',	//	検索ワード　APIではqueryで処理
			//limit:10,	//	検索結果数
			//targetChannels:'0,1',		//	検索対象の放送波　0（CATV）、1（コミュチャン）、2（BS）、3（地デジ）カンマ区切りで複数設定可
			//serviceCode:'561_65406,560_65406',	
			queryTarget:0,	//	検索対象　0（すべて：初期設定）、1（番組名）、2（番組内容）　省略可
      queryType:0,	//	0（and検索）,　1（or検索）
			attr:null, // イベント属性 デフォルトなし
		
			//	2021/3/17 追加機能
			//optionChannel:0,// チャンネル種別 0（基本チャンネル） 1（オプションチャンネル）、指定無しの場合は、絞り込み無し
			//programId:'4716,547442', // プログラムIDを指定。カンマ区切りで複数指定可能。指定無しは絞り込み無し 集約されたマスタ情報が存在する場合は、親の番組マスタ情報を返却。
			//alignment:'new,feature,classic', //	番組マスタ管理画面から登録した任意文字列のフラグを指定する。カンマ区切りで複数指定可能。
			alignment_title:'BTS特集と年末年始一挙放送と年末年始特番',// フラグ名を表示する際の文言、設定ない場合はフラグそのまま。
			//hasExternalText:0,	// 0（すべて：初期設定） 1（追加コンテンツテキストありのみ） 番組マスタ管理画面から登録したテキストコンテンツが存在するマスタ情報を返却する。
			//hasExternalImage:0,	// 0（すべて：初期設定） 1（追加コンテンツ画像ありのみ） 番組マスタ管理画面から登録した画像コンテンツが存在するマスタ情報を返却する。
			//hasExternalVideo:0,	// 0（すべて：初期設定） 1（追加コンテンツ動画ありのみ） 番組マスタ管理画面から登録した動画コンテンツが存在するマスタ情報を返却する。
			//sort:0,	//	0（直近SI放送日時：初期設定)、1（番組マスタ名)、2（チャンネル)、3（ジャンル)
			//order:0,	//	0（昇順：初期設定)、1（降順)
			hasNextSi:0,	// 直近放送の有無	0（すべて：初期設定） 1（直近放送情報有りのみ） 直近放送情報が存在する番組マスタを返却する。
		};	
		
	//	制御用パラメータ
	var statusObj = {
			uid:0,	//	UID
			container:'.program_master_api_container',		//番組表格納コンテナ（.付きの文字列で指定）デフォルト：.tv_program_list　省略可
			//container_parent:'.section_programlist',	// [Bランクでは設定NG!] 検索結果がない場合やエラー発生時、非表示にするエリア（.付きの文字列で指定）デフォルト：.section_relation_program .content_program（Bランク用）
			ng_genreid:'31,60',	//	指定したジャンルIDを除外
			ng_perfectmatching:false,	//	NGワードを完全一致とする（true）しない（false:デフォルト）　省略可
			nodata_hide:true,	//	検索結果がない場合やエラー発生時、エリアごと非表示にする（true:デフォルト）しない（false）　省略可
			displayN:10,	//	もっと見るボタンを表示。指定数ずつ番組を表示する　省略可
			callback:'jcomProgramMasterAPIComplete',	//	コールバック関数 デフォルト：searchProgramAPIComplete　省略可
			useRecommend:0,// おすすめ番組フラグを利用 0（しない：デフォルト）,1（する）
		};	
		
	//	データ呼び出し
	getJcomProgramMasterList(searchObj,statusObj);
	
/*==============================================*/

//var defaultNGwords = ['番組案内','番組ガイド','メガパックで配信中！'];

function getJcomProgramMasterList(_searchObj,_statusObj){
	trace("番組表マスターAPI （jcom_api.js）");
	setCurrentTimeForAPI();
	trace(_searchObj);
	var user_area_id = jQuery.cookie("area_id");
	if(user_area_id == undefined){
		user_area_id = 12;
	}
	var searchObj = {};
	var statusObj = {};
	
	// _searchObjからAPI検索用Objを抽出
	
	//	2021/4/1追加
	if(_searchObj.hasNextSi != null){
		searchObj.hasNextSi =  _searchObj.hasNextSi;
	}
	//	2021/3/18追加
	if(_searchObj.optionChannel != null){
		searchObj.optionChannel =  _searchObj.optionChannel;
	}
	if(_searchObj.programId != null){
		searchObj.programId =  _searchObj.programId;
	}
	if(_searchObj.alignment != null){
		searchObj.alignment =  _searchObj.alignment;
	}
	if(_searchObj.alignment_title != null){
		searchObj.alignment_title =  _searchObj.alignment_title;
	}else{
		searchObj.alignment_title =  _searchObj.alignment;
	}
	if(_searchObj.hasExternalText != null){
		searchObj.hasExternalText =  _searchObj.hasExternalText;
	}
	if(_searchObj.hasExternalImage != null){
		searchObj.hasExternalImage =  _searchObj.hasExternalImage;
	}
	if(_searchObj.hasExternalVideo != null){
		searchObj.hasExternalVideo =  _searchObj.hasExternalVideo;
	}
	if(_searchObj.sort != null){
		searchObj.sort =  _searchObj.sort;
	}
	if(_searchObj.order != null){
		searchObj.order =  _searchObj.order;
	}
	if(_searchObj.attr != null){
		searchObj.attr =  _searchObj.attr;
	}
	if(_searchObj.adult != null){
		searchObj.adult =  _searchObj.adult;
	}else{
		searchObj.adult = 0;
	}
	if(_searchObj.attr != null){
		searchObj.attr =  _searchObj.attr;
	}

	if(_searchObj.areaId != null){
		searchObj.areaId =  _searchObj.areaId;
	}else{
		searchObj.areaId = user_area_id;
	}

	if(_searchObj.limit != null){
		searchObj.limit = 100;
		statusObj.limit = _searchObj.limit;
	}else{
		searchObj.limit = 1000;
		statusObj.limit = 1000;
	}

	if(_searchObj.keyword != null){
    searchObj.query = _searchObj.keyword;
    searchObj.keyword = _searchObj.keyword;
	}
	
	if(_searchObj.genreId != null){
		if(_searchObj.genreId != 'null'){
			searchObj.genreId = encodeURI(_searchObj.genreId);
			if(searchObj.keyword == ""){
			searchObj.keyword = getProgramAPIGenrIDName(searchObj.genreId);
			//trace(searchObj.genreId+"  searchObj.keyword "+searchObj.keyword);
			};
		}
	}

	//	放送波の設定あればチャンネル設定無効
	if(_searchObj.targetChannels != null){
		//trace("_searchObj.targetChannels ある　"+_searchObj.targetChannels);
		searchObj.targetChannels = _searchObj.targetChannels;
		
		var targetChannels_arr = _searchObj.targetChannels.split(',');
		var wavename = "";
		if(1 < targetChannels_arr.length){
			
			for(var i=0;i<targetChannels_arr.length;i++){			
				if(i < 4){
					if(i != 0) wavename += " / ";
					wavename += getTargetChannelTypeByID(targetChannels_arr[i]);	
				}
			}//	for				
		}else{
			wavename = getTargetChannelTypeByID(_searchObj.targetChannels);
		}
		if(searchObj.keyword == "") searchObj.keyword = wavename;
	
	}else{
		if(_searchObj.serviceCode != null){
			//trace("_searchObj.serviceCode ある　"+_searchObj.serviceCode);
			
			searchObj.serviceCode = _searchObj.serviceCode;
			var serviceCode_arr = _searchObj.serviceCode.split(',');
			var chname = "";
			if(1 < serviceCode_arr.length){
				
				for(var i=0;i<serviceCode_arr.length;i++){			
					if(i < 3){
						if(i != 0) chname += " / ";
						chname += getChannelNameByServiceCode(serviceCode_arr[i]);					
					}else if(i == 3){
						chname += " などのチャンネル";
					}
				}//	for				
			}else{
				chname = getChannelNameByServiceCode(_searchObj.serviceCode);
			}
			
			if(searchObj.keyword == "") searchObj.keyword = chname;
		}
	}
	
	if(_searchObj.queryType != null){
		searchObj.queryType = Number(_searchObj.queryType);
	}else{
		searchObj.queryType = 0;
	}
	
	if(_searchObj.queryTarget != null){
		searchObj.queryTarget = _searchObj.queryTarget;
	}else{
		searchObj.queryTarget = 0;
	}
	
	// _statusObjから制御用Objを抽出
	
	if(_statusObj.uid != null) statusObj.uid = _statusObj.uid;
	if(_statusObj.masterUid != null) statusObj.masterUid = _statusObj.masterUid;
	
	if(_statusObj.container != null){
		statusObj.container = _statusObj.container;
	}else{
		statusObj.container = '.program_master_list';
	}
	if(_statusObj.container_parent != null){
		statusObj.container_parent = _statusObj.container_parent;
	}else{
		statusObj.container_parent = '.section .content_programmaster';
	}
	if(_statusObj.callback != null){
		statusObj.callback = _statusObj.callback;
	}else{
		statusObj.callback = "searchProgramAPIComplete";
	}
	if(_statusObj.research != null){
		statusObj.research = _statusObj.research;
	}else{
		statusObj.research = false;
	}
	if(_statusObj.nodata_hide != null){
		statusObj.nodata_hide = _statusObj.nodata_hide;
	}else{
		statusObj.nodata_hide = true;
	}
	if(_statusObj.noimage != null){
		statusObj.noimage = _statusObj.noimage;
	}else{
		statusObj.noimage = '/special/common/images/no_image_800x448.jpg';
	}
	if(_searchObj.title != null){
		searchObj.keyword = _searchObj.title;
	}
	
	if(searchObj.keyword == "") searchObj.keyword = "検索条件なし";

	//	もっと見るボタンでの表示数
	if(_statusObj.displayN != null){
		statusObj.displayN = _statusObj.displayN;
	}
	
	//	もっと見るボタンでの表示数
	if(_statusObj.useRecommend != null){
		statusObj.useRecommend = _statusObj.useRecommend;
	}else{
		statusObj.useRecommend = 0;
	}

	//	NGワード追加
	if(_statusObj.ngwords != undefined){
		statusObj.ngwords = _statusObj.ngwords;
		} else {
		statusObj.ngwords = [];
	}
	
	if(_statusObj.ng_perfectmatching != null){
		statusObj.ng_perfectmatching = _statusObj.ng_perfectmatching;
	}else{
		statusObj.ng_perfectmatching = false;
	}
	//	NGチャンネル
	if(_statusObj.ng_channels != undefined){
		statusObj.ng_channels = _statusObj.ng_channels;
	} else {
		statusObj.ng_channels = [];
	}
	//	NGジャンルID
	if(_statusObj.ng_genreid != undefined){
		statusObj.ng_genreid = _statusObj.ng_genreid;
	} else {
    statusObj.ng_genreid = [];
	}
	// コールバックパラメータ名の指定
	jsonpCallbackUID ++;
	statusObj.jsonpCallback = 'search_program'+jsonpCallbackUID;

	searchJCOMProgramMasterAPI(searchObj,statusObj);
}

//function isArray(obj) {
//    return Object.prototype.toString.call(obj) === '[object Array]';
//}
/*--------------------------------------------------------------
	番組表マスターAPI：検索
--------------------------------------------------------------*/
function searchJCOMProgramMasterAPI(searchObj,statusObj){
	trace('番組表マスターAPI（jcom_api）：検索');
	var result = [];
	var message = "";
	var dataType = "jsonp";
	var jsonpCallback = statusObj.jsonpCallback;
	var url = "https://tvguide.myjcom.jp/api/getProgramMaster/?"; 
	var alignment_title = searchObj.alignment_title;

	if(isMyjcom){
		url += getAPIRequestQuery(searchObj,false);
		//trace("番組表マスターAPI（jcom_api）：myjcom "+url);
	}else{
		var param = getAPIRequestQuery(searchObj,true);
		url = api_php_path+'wrp='+jsonpCallback+'&url='+url+param;
		url = location.protocol+"//"+location.host+url;	// ローカルからアクセスできるよう絶対パスで指定
		//trace("番組表マスターAPI（jcom_api）：other "+url);
	}

	var callback = statusObj.callback;
	var load_status;

	$.ajax({
		url: url,
		type:'POST',
		dataType: dataType,
		jsonpCallback: jsonpCallback
	}).done(function(data){ // Ajaxリクエストが成功した時発動
		trace("番組表マスターAPI（jcom_api）：DONE");
		trace(data);

		if(data === undefined) {
			result = ['検索失敗（data === undefined）'];    
			load_status = 2;
			trace("検索失敗（番組表マスターAPI（jcom_api）：DONE）"+result);
			return;
		}

		data.totalCount = statusObj.totalCount;
		trace("data.totalCount "+data.totalCount);

		load_status = data.status;
		if(load_status != 0) return;
		var pdata = data.programMst;
		trace(pdata);

		//	録画予約が可能な日数
		//    var recPossibleDate = getDateAfterXdays(new Date(),8);

		trace("pdata.length "+pdata.length);

		if(pdata.length != 0){
			var count = 0;
			var limit = statusObj.limit;
			var ngwords = statusObj.ngwords;// NGワード
			var ng_channels = statusObj.ng_channels;// NGチャンネル
			var ng_perfectmatching = statusObj.ng_perfectmatching;
			var ng_genreid = statusObj.ng_genreid;// NGジャンルID

			//	検索結果データを作成
			jQuery.each(pdata, function(key, val){

				if(count == limit)  return true;

				var programId = val.programId;
				var title = val.title;

				// NGワード（タイトル）
				var hasNG = hasNGwords(title,ngwords,ng_perfectmatching);
				if(hasNG) return true;

				var channels = val.channels;
				var serviceCode = val.channels[0].serviceCode;
				var channelType = val.channels[0].channelType;
				var channelNo = val.channels[0].channelNo;
				var channelName = val.channels[0].channelName;
				var channelLogoUrl = val.channels[0].channelLogoUrl;

				// NGチャンネル
				var hasNGChannel = hasNGwords(channelName,ng_channels,ng_perfectmatching);					
				if(hasNGChannel) return true;

				//					if(35 < key && key < 39){
				// NGジャンルID
				var hasNGGenreID = false;
				if(ng_genreid.length != 0){
				hasNGGenreID = hasNGGenreIDCheck(val.genreIds,ng_genreid);
				//trace(val.genreIds+"  hasNGGenreID "+hasNGGenreID +"  "+title);
				if(hasNGGenreID) return true;
				}
				//
				//					}

				var genreIds = val.genreIds;
				var summary = val.summary;
				var url = val.url;
				var attr = val.attr;
				// 番組ステータス
				// var live = (-1 !== attr.indexOf('live'));
				// var first = (-1 !== attr.indexOf('first'));
				// var repeat = (-1 !== attr.indexOf('rep'));
				// var duo = (-1 !== attr.indexOf('duo'));
				// var free = (-1 !== attr.indexOf('free'));

				var live   = attr.includes('live');
				var first  = attr.includes('first');
				var repeat = attr.includes('rep');
				var duo    = attr.includes('duo');
				var free   = attr.includes('free');

				var photos = val.photos;
				var photo = (photos[0]) ? val.photos[0].photo : statusObj.noimage;
				var copyright = (photos[0]) ? val.photos[0].copyright : '';

				var externalText = val.externalText;
				var externalTextTitle = (externalText[0]) ? val.externalText[0].title : false;
				var externalTextContent = (externalText[0]) ? val.externalText[0].content : false;
				var externalImage = val.externalImage;
				var externalImageUrl = (externalImage[0]) ?  val.externalImage[0].url: false;
				var externalVideo = val.externalVideo;
				var embed = (externalVideo[0]) ?  val.externalVideo[0].embed: false;
				var warningMessage = val.warningMessage;
				var errorCode = val.errorCode;
				var errorMessage = val.errorMessage;

				// 直近の番組スケジュール
				var next_dateObj,next_date,next_date_short;
				var hasNextTime = false;
				var nextStartTime = val.nextStartTime;
				if(hasNextTime != undefined){
					next_dateObj = YYYYMMDDhhmmssToDateObj(nextStartTime);
					next_date = formatDate(next_dateObj, 'YYYY年MM月DD日（W）hh:mm');
					next_date_short  = formatDate(next_dateObj, 'MM/DD(W) hh:mm');

					var next_date_short_arr = next_date_short.split('/');
					var short_year = Number(next_date_short_arr[0]);

					//trace("short_year "+short_year);
					var short_month_arr = next_date_short_arr[1].split('(');
					var short_month = Number(short_month_arr[0]);
					next_date_short = short_year+"/"+short_month+'('+short_month_arr[1];
					hasNextTime = true;
				}

				var end_dateObj,end_date,end_time;
				var hasEndTime = false;
				var nextEndTime = val.nextEndTime;
				if(nextEndTime != undefined){
					end_dateObj = YYYYMMDDhhmmssToDateObj(nextEndTime);
					end_date = formatDate(end_dateObj, 'MM月DD日（W）hh:mm');
					end_time = formatDate(end_dateObj, 'hh:mm');
					hasEndTime = true;
				}

				//
				var onairTimeObj = checkThisProgramNowOnair(next_dateObj,nextStartTime,nextEndTime);
				var nowonair = onairTimeObj.nowonair;
				var todayonair = onairTimeObj.todayonair;

				var obj = {
					programId:programId,
					title:title,
					channels:channels,
					serviceCode:serviceCode,
					channelType:channelType,
					channelNo:channelNo,
					channelName:channelName,
					channelLogoUrl:channelLogoUrl,
					genreIds:genreIds,
					summary:summary,
					url:url,
					attr:attr,
					live:live,
					first:first,
					repeat:repeat,
					duo:duo,
					free:free,
					photos:photos,
					photo:photo,
					copyright:copyright,
					externalText:externalText,
					externalTextTitle:externalTextTitle,
					externalTextContent:externalTextContent,
					externalImage:externalImage,
					externalImageUrl:externalImageUrl,
					externalVideo:externalVideo,
					embed:embed,
					warningMessage:warningMessage,
					errorCode:errorCode,
					errorMessage:errorMessage,
					nextStartTime:nextStartTime,
					nextEndTime:nextEndTime,
					next_date:next_date,
					next_date_short:next_date_short,
					end_date:end_date,
					next_dateObj:next_dateObj,
					end_dateObj:end_dateObj,
					hasNextTime:hasNextTime,
					hasEndTime:hasEndTime,
					end_time:end_time,
					alignment_title:alignment_title,
					nowonair:nowonair,
					todayonair:todayonair
				};


				result.push(obj);

				count++;
			});//jQuery.each
			//*/
		}else{
		//    検索結果なし
			result = ['検索結果はありません'];    
			load_status = 1;
		}

	}).fail(function(data){  // Ajaxリクエストが失敗した時発動
		result = ["APIエラー："+data.errorMassage];    
		load_status = 2;
		trace("番組表マスターAPI（jcom_api）：FAIL "+result);

	}).always(function(data){  // Ajaxリクエストが成功・失敗どちらでも発動
		/**/
		trace("番組表マスターAPI（jcom_api）：ALWAYS");
		trace(searchObj);
		trace(statusObj);
		trace(result);
		//trace(data);
		//*/
		searchObj.searchBtnURL = getSearchProgramMasterBtnURL(searchObj);
		statusObj.api_type = 'master';

		if(callback != null) parent[callback](result,load_status,searchObj,statusObj);
	});

}

/*--------------------------------------------------------------
	番組表マスターAPI：もっとみるボタンのURL
	2021/3/18
--------------------------------------------------------------*/
function getSearchProgramMasterBtnURL(searchObj){
	var query = (searchObj.query) ? "keyword="+searchObj.query : "";
	var genreId = (searchObj.genreId) ? "&genre="+searchObj.genreId : "";
	var queryTypeID = (searchObj.queryType) ? searchObj.queryType : "";
	var queryType = "";
	
	if(queryTypeID == 1){
		queryType = "&keywordType=or";
	}
	
	var targetChannels = "";
	var channel = "";
	
	//trace("searchObj.targetChannels "+searchObj.targetChannels);
	
	if(searchObj.targetChannels != null){
		targetChannels = getTargetChannelsQuery(searchObj.targetChannels);
	}else if(searchObj.serviceCode != null){
		channel = '&channel='+searchObj.serviceCode;
	}
	
	var keywordType = "";
	if(searchObj.queryType){
		keywordType = (searchObj.queryType == 0) ? "&keywordType=and" : "&keywordType=or";
	}
	
	var queryTarget = "";
	if(searchObj.queryTarget){
		if(searchObj.queryTarget == 1){
			queryTarget = '&keywordTarget=title';
		}else if(searchObj.queryTarget == 2){
			queryTarget = '&keywordTarget=detail';
		}
	}
	
	var url = "https://tvguide.myjcom.jp/search/event/?"+query+targetChannels+genreId+channel+keywordType+queryTarget;
	//if(isStage) url = "https://stage-tvguide.myjcom.jp/search/event/?"+query+targetChannels+genreId+channel+keywordType;

	return encodeURI(url);
}

/*--------------------------------------------------------------
	現在放送中　nowonair
--------------------------------------------------------------*/
var currentTimeForAPI_Date,currentTimeForAPI_Year,currentTimeForAPI_Month,currentTimeForAPI_Day,currentTimeForAPI_Hour,currentTimeForAPI_Minutes;
var currentTimestamp;

function setCurrentTimeForAPI(){
	currentTimeForAPI_Date = new Date();
	//currentTimeForAPI_Date = new Date('2023-08-24 18:10:00');

	currentTimeForAPI_Year = formatDate(currentTimeForAPI_Date, 'YYYY');
	currentTimeForAPI_Month = formatDate(currentTimeForAPI_Date, 'MM');
	currentTimeForAPI_Day = formatDate(currentTimeForAPI_Date, 'DD');
	currentTimeForAPI_Hour = parseInt(currentTimeForAPI_Date.getHours());
	currentTimeForAPI_Minutes = parseInt(currentTimeForAPI_Date.getMinutes());

	var currentYear = currentTimeForAPI_Date.getFullYear();
	var currentMonth = ('0' + (currentTimeForAPI_Date.getMonth() + 1)).slice(-2);
	var currentDay = ('0' + currentTimeForAPI_Date.getDate()).slice(-2);
	var currentHour = ('0' + currentTimeForAPI_Date.getHours()).slice(-2);
	var currentMinute = ('0' + currentTimeForAPI_Date.getMinutes()).slice(-2);
	var currentSecond = ('0' + currentTimeForAPI_Date.getSeconds()).slice(-2);
	currentTimestamp = currentYear + currentMonth + currentDay + currentHour + currentMinute + currentSecond;

}

function checkThisProgramNowOnair(startDate,startTime,endTime){
		// NO ON AIR
		var flg_nowonair = false;
		var flg_todayonair = false;

		// 指定した日時が本日中かどうかを判定する関数
		function isToday(datetime) {
			// var now = new Date();
			var currentDate = currentTimeForAPI_Date.getFullYear().toString() +
					('0' + (currentTimeForAPI_Date.getMonth() + 1)).slice(-2) +
					('0' + currentTimeForAPI_Date.getDate()).slice(-2);

			var datePart = datetime.substring(0, 8);
			var datePartNumber = parseInt(datePart);
			return datePartNumber === parseInt(currentDate);
		}

		// 開始日付と終了日付を数値に変換
		var startDate = parseInt(startTime.substring(0, 14));
		var endDate = parseInt(endTime.substring(0, 14));
		var currentTimestampNumber = parseInt(currentTimestamp);

		// 現在の日付が開始日付と終了日付の間にあるか判定
		flg_nowonair = currentTimestampNumber >= startDate && currentTimestampNumber <= endDate;

		// 開始日時と終了日時が本日中か判定
		flg_todayonair = isToday(startTime);

		var onairTimeObj = {
			nowonair:flg_nowonair,
			todayonair:flg_todayonair
		}	
		

		return onairTimeObj;
	
}//	
