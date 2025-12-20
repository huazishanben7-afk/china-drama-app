/*--------------------------------------------------------------
	2018/10/3
	2021/4/5
	scripts.js
--------------------------------------------------------------*/	
function trace(val){
	//console.log(val);
	//window.alert(val);
}
/*--------------------------------------------------------------

	PROP

--------------------------------------------------------------*/	
var stageW,stageH,pageW,pageH;
var isAndroid = false;
var isDebug = false;
var thisDevice;
var device = "PC";
var isPC = false;
var isSP = false;
var isTablet = false;
var isMobile = false;

//　cssのブレイクポイント設定と合わせる
var spW = 800;	//	スマホ幅
var tabW = 1070;	//	タブレット幅

/*--------------------------------------------------------------

	START

--------------------------------------------------------------*/	
$(function(){
	$('img').imagesLoaded( function(){
		utils_init();
		addEvent();
		contentStart();
	});
    
    
});// jQuery

/*--------------------------------------------------------------

	CONTENT START

--------------------------------------------------------------*/
function contentStart(){
	trace("CONTENT START!");

	//	テーマヘッダ
	if($('.thema_header')[0]){
		initThemaHeader();
	}
/**/
  //	今月のおすすめ番組（マスターAPI）
  if($('.lane_wrp_01')[0]){
		loadLane01();
	}
	

  //	今日・明日の番組（番組表API）
	if($('.lane_wrp_02')[0]){
		loadLane02();
	}
	
/**/
  //	今月の新番組・新スタート（マスターAPI）
	if($('.lane_wrp_03')[0]){
		loadLane03();
	}

  //	今週の録画予約ランキング（ランキングAPI）
	if($('.lane_wrp_04')[0]){
		loadLane04();
	}
	

  //	韓国サスペンス（関連番組API）lane_wrp_05
	if($('.lane_wrp_05')[0]){
		loadLane05();
	}
  //	韓国ロマンティックコメディ（関連番組API）lane_wrp_06
	if($('.lane_wrp_06')[0]){
		loadLane06();
	}
  //	時代劇？？（関連番組API）lane_wrp_07
	if($('.lane_wrp_07')[0]){
		loadLane07();
	}
  //	人気アイドル出演（関連番組API）lane_wrp_08
  if($('.lane_wrp_08')[0]){
		loadLane08();
	}
	
  //	J:COMオンデマンド J:COM STREAM ラブストーリー
  if($('.lane_wrp_09')[0]){
		loadLane09();
	}
   //	J:COMオンデマンド J:COM STREAM 歴史
  if($('.lane_wrp_09_2')[0]){
		loadLane09_2();
	}
  //	J:COMオンデマンド J:COM STREAM サスペンス・その他
  if($('.lane_wrp_09_3')[0]){
		loadLane09_3();
	}	
  //	プレゼント（イベプレAPI）lane_wrp_10
  if($('.lane_wrp_10')[0]){
		loadLane10();
	}
  //	関連情報（静的）lane_wrp_bnr
	if($('.lane_wrp_bnr')[0]){
		loadLaneBnr();
	}
	//	J:magazine!
	if($('.lane_wrp_jmaga')[0]){
		loadLaneJMagazine();
	}
//*/
	//	インタビュー詳細 出演番組情報
	if($('.page_interview_detail')[0]){
		initInterviewDetail();
	}
	
	$('.hover a').hover(function(){
		$(this).css({'opacity':0.7});
	},function(){
		$(this).css({'opacity':1});
	});
  
  // 右クリック禁止
  $('.thiscontents').on("contextmenu",function(){
    return false;
  });

	//	高さ揃える
	if ($('.alignHeight')[0]){
		setAlignHeightEvent();
		addResizeCompleteEvent("setAlignHeightEvent");
	}
	//	高さ揃える
	if ($('.listwrp')[0]){
		setAlignHeightEvent2();
		addResizeCompleteEvent("setAlignHeightEvent2");
	}
  
  //	PAGETOP
	if ($('#btn_pagetop')[0]){
		setPagetop();
		addScrollEvent("setPagetop");
	}
  //	モーダル
	if($('.modal')[0]){
		initModal();
	}
  
  // 外部ページからアンカーリンク遷移のずれ対応
	if(2<location.hash.length){	// #以降に何かあれば以下を実行
		setTimeout(function(){
			moveHashLink();
		},1000);
	}
	
	
	hashcheck();// ※ contentStart関数内の一番最後に記述する。 
	
}

/*--------------------------------------------------------------

	//	テーマヘッダナビ、固定

--------------------------------------------------------------*/
function initThemaHeader(){
    const pageHeader = document.querySelector(".frame_header");
    const themaHeader = document.querySelector(".thema_header");
    const thiscontents = document.querySelector(".thiscontents");
    const themaHeaderHeight = themaHeader.clientHeight;
    
		const options = {
				root: null,
				rootMargin: "0px",
				threshold: 0
		};

		const obserberHeader = new IntersectionObserver(checkHeader, options);
		obserberHeader.observe(pageHeader);

		function checkHeader(entries){
			for(const e of entries) {
				if(e.isIntersecting) {
					themaHeader.classList.remove('fixed');
					thiscontents.style.paddingTop='0px';
				} else{
					themaHeader.classList.add('fixed');
					thiscontents.style.paddingTop= themaHeaderHeight+'px';
				}
			}
		}
}

/*--------------------------------------------------------------

	今月のおすすめ番組（マスターAPI） lane_wrp_01

--------------------------------------------------------------*/
//	番組表マスターAPI：読み込み
function loadLane01(){
	trace("loadLane01");
	
	//	APIパラメータ
	var searchObj = {
		attr:null, // イベント属性 デフォルトなし
		alignment:'中国ドラマ_おすすめ', //	番組マスタフラグ
	};
		
	//	制御用パラメータ
	var statusObj = {	
		uid:0,	//	UID
		container:'.lane_wrp_01 .slick_slider',		//番組表格納コンテナ
		container_parent:'.lane_wrp_01',	// 親要素
		callback:'loadLane01Complete',	//	コールバック関数
	};
		
	//	データ呼び出し
  getJcomProgramMasterList(searchObj,statusObj);
}

//	番組表マスターAPI：読み込み完了
function loadLane01Complete(result,status,searchObj,statusObj){
	trace("番組表マスターAPI：読み込み完了");
	trace(result);
	
	var slider = $(statusObj.container);
	var parent =  $(statusObj.container_parent);
	var html = "";
	var option;
	var class_name;
	
	//	番組情報がなければ非表示
	if(result.length == 0 || status != 0 ){
		parent.hide();
		parent.addClass('nodata');
		return;
	} 
	
	//	番組の数によって設定を調整
	var sliderObj = getSliderDataAndStatus(result);
	var data = sliderObj.data;
	var option = sliderObj.option;
	var class_name = sliderObj.class_name;
	parent.addClass(class_name);
	//	スライダーの管理に登録
	sliderObj.slider = slider;
	addSliderObjList(sliderObj);
	
	//	HTMLを作成
	var loop = data.length;
	for(var i=0;i<loop;i++){

		//	API種別によってフォーマットを調整
		var myData = getMyDataByMasterAPI(data[i]);

		//	データからHTMLを生成、コピーライトの追加
		html += createLaneSliderHTML(myData);
		addCopyrightSection(myData.copyright);
	}//	for	
	
	//	準備完了
	slider.addClass("loaded");
	slider.html(html);
	
	//	スライダー起動
	slider.slick(option);
	
}//

/*--------------------------------------------------------------

	今日・明日の番組（番組表API）lane_wrp_02

--------------------------------------------------------------*/
//	番組表API：読み込み
function loadLane02(){
	trace("loadLane02");

	//今日明日に絞る
	var now = new Date(); 
	//now = new Date("2022/12/31 01:03"); 
	var next_year;
	var year = this_year = now.getFullYear();
	var month = now.getMonth()+1;
	var day = now.getDate();
	var hour = now.getHours();
	var min = now.getMinutes();
	
	if(month < 10) month = "0"+month;
	if(day < 10) day = "0"+day;
	if(hour < 10) hour = "0"+hour;
	if(min < 10) min = "0"+min;
	var since = year+""+month+""+day+""+hour+""+min;
	
	now.setDate(day + 2);
	year = now.getFullYear();
	
	month = now.getMonth()+1;
	day = now.getDate();
	
	if(month < 10) month = "0"+month;
	if(day < 10) day = "0"+day;
	hour = 23;
	min = 59;
	var until = year+""+month+""+day+""+hour+""+min;
	
	//trace("since "+since+"〜"+until);

	
	//	APIパラメータ
	var searchObj = {
		//limit:20,	//	検索結果数
		targetChannels:'0',
    genreId:'31',
    keyword:'中国　華',
//		recommend:1,
		since:since,
		until:until,
	};
		
	//	制御用パラメータ
	var statusObj = {	
		uid:0,	//	UID
		container:'.lane_wrp_02 .slick_slider',		//番組表格納コンテナ
		container_parent:'.lane_wrp_02',	// 親要素
		callback:'loadLane02Complete',	// コールバック関数 デフォルト：searchProgramAPIComplete 省略可
		useRecommend:1,// おすすめ番組フラグを利用 0（しない：デフォルト）,1（する）
	};
		
	//	データ呼び出し
  getJcomProgramList(searchObj,statusObj);
	
}

//	番組表API：読み込み完了
function loadLane02Complete(result,status,searchObj,statusObj){
	trace("今日・明日の番組 番組表API：読み込み完了");
	trace(result);
	
	var slider = $(statusObj.container);
	var parent =  $(statusObj.container_parent);
	var html = "";
	var option;
	var class_name;
	
	//	番組情報がなければ非表示
	if(result.length == 0 || status != 0 ){
		parent.hide();
		parent.addClass('nodata');
		return;
	} 
	
	//	番組の数によって設定を調整
	var sliderObj = getSliderDataAndStatus(result);
	var data = sliderObj.data;
	var option = sliderObj.option;
	var class_name = sliderObj.class_name;
	parent.addClass(class_name);
	//	スライダーの管理に登録
	sliderObj.slider = slider;
	addSliderObjList(sliderObj);
	
	//	HTMLを作成
	var loop = data.length;
	for(var i=0;i<loop;i++){

		//	API種別によってフォーマットを調整
		var myData = getMyDataByProgramAPI(data[i]);
		
		//	データからHTMLを生成、コピーライトの追加
		html += createLaneSliderHTML(myData);
		addCopyrightSection(myData.copyright);
	}//	for	
	
	//	準備完了
	slider.addClass("loaded");
	slider.html(html);
	
	var thisOption = Object.assign({},option);
	thisOption.autoplay = false;
	
	//	スライダー起動
	slider.slick(thisOption);
	
	
}//

/*--------------------------------------------------------------

	今月の新番組・新スタート（マスターAPI）lane_wrp_03

--------------------------------------------------------------*/
//	番組表マスターAPI：読み込み
function loadLane03(){
	trace("loadLane03");
	
	//	APIパラメータ
	var searchObj = {
		attr:null, // イベント属性 デフォルトなし
		alignment:'中国ドラマ_新番組', //	番組マスタフラグ
    //keyword:'華',
	};
		
	//	制御用パラメータ
	var statusObj = {	
		uid:0,	//	UID
		container:'.lane_wrp_03 .slick_slider',		//番組表格納コンテナ
		container_parent:'.lane_wrp_03',	// 親要素
		callback:'loadLane03Complete',	//	コールバック関数
	};
		
	//	データ呼び出し
  getJcomProgramMasterList(searchObj,statusObj);
}

//	番組表マスターAPI：読み込み完了
function loadLane03Complete(result,status,searchObj,statusObj){
	trace("番組表マスターAPI：読み込み完了");
	trace(result);
	
	var slider = $(statusObj.container);
	var parent =  $(statusObj.container_parent);
	var html = "";
	var option;
	var class_name;
	
	//	番組情報がなければ非表示
	if(result.length == 0 || status != 0 ){
		parent.hide();
		parent.addClass('nodata');
		return;
	} 
	
	//	番組の数によって設定を調整
	var sliderObj = getSliderDataAndStatus(result);
	var data = sliderObj.data;
	var option = sliderObj.option;
	var class_name = sliderObj.class_name;
	parent.addClass(class_name);
	//	スライダーの管理に登録
	sliderObj.slider = slider;
	addSliderObjList(sliderObj);
	
	//	HTMLを作成
	var loop = data.length;
	for(var i=0;i<loop;i++){

		//	API種別によってフォーマットを調整
		var myData = getMyDataByMasterAPI(data[i]);

		//	データからHTMLを生成、コピーライトの追加
		html += createLaneSliderHTML(myData);
		addCopyrightSection(myData.copyright);
	}//	for	
	
	//	準備完了
	slider.addClass("loaded");
	slider.html(html);
	
	//	スライダー起動
	slider.slick(option);
	
}//

/*--------------------------------------------------------------

	今週の録画予約ランキング（ランキングAPI）lane_wrp_04

--------------------------------------------------------------*/
//	ランキングAPI：読み込み
function loadLane04(){
	trace("loadLane04");
	
	//	APIパラメータ
	var searchObj = {
		rankingType:1,
		channelType:120,
		limit:100,
    genreId:'31',
	};
		
	//	制御用パラメータ
	var statusObj = {	
		uid:0,	//	UID
    serchTxt:['華','中国ドラマ'],//	検索結果からキーワードで絞り込む。独自実装
		container:'.lane_wrp_04 .slick_slider',		//番組表格納コンテナ
		container_parent:'.lane_wrp_04',	// 親要素
		callback:'loadLane04Complete',	// コールバック関数 デフォルト：searchProgramAPIComplete 省略可
	};
		
	//	データ呼び出し
  getJcomRankingList(searchObj,statusObj);
	
}

//	ランキングAPI：読み込み完了
function loadLane04Complete(result,status,searchObj,statusObj){
	trace("ランキングAPI：読み込み完了　"+status);
	trace(result);
	
	var period_str = statusObj.summaryFrom_short+'(金)〜'+statusObj.summaryTo_short+'(木)';
	$('.lane_wrp_04 .lane_header .lead').html(period_str);
	
	var slider = $(statusObj.container);
	var parent =  $(statusObj.container_parent);
	var html = "";
	var option;
	var class_name;
	
	//	番組情報がなければ非表示
	if(result.length == 0 || status != 0 ){
		parent.hide();
		parent.addClass('nodata');
		return;
	}

	
	//	番組の数によって設定を調整
  var sliderObj = getSliderDataAndStatus(result);
	var data = sliderObj.data;
	var option = sliderObj.option;
	var class_name = sliderObj.class_name;
	//	スライダーの管理に登録
	sliderObj.slider = slider;
	addSliderObjList(sliderObj);	
	
	parent.addClass(class_name);
	
	
	//	HTMLを作成
	var loop = data.length;
	for(var i=0;i<loop;i++){

		//	API種別によってフォーマットを調整
		var myData = getMyDataByRankingAPI(data[i]);

		//	データからHTMLを生成、コピーライトの追加
		html += createLaneSliderHTML(myData);
		addCopyrightSection(myData.copyright);
	}//	for	
	
	//	準備完了
	slider.addClass("loaded");
	slider.html(html);
	
	//	スライダー起動
	slider.slick(option);
	
}//


/*--------------------------------------------------------------

	中国歴史ドラマ（関連番組API）lane_wrp_05

--------------------------------------------------------------*/
//	関連番組API：読み込み
function loadLane05(){
	trace("loadLane05");
	
	//	APIパラメータ
	var searchObj = {
    //中国歴史ドラマ
		tag:'%E4%B8%AD%E5%9B%BD%E3%81%AE%E6%AD%B4%E5%8F%B2%E3%81%8C%E3%83%89%E3%83%A9%E3%83%9E%E3%81%A7%E8%98%87%E3%82%8B%21',
    //tag:'%E6%97%A5%E6%9C%AC%E3%81%A8%E3%81%AF%E4%B8%80%E5%91%B3%E9%81%95%E3%81%86!%3F%E9%9F%93%E5%9B%BD%E3%82%B5%E3%82%B9%E3%83%9A%E3%83%B3%E3%82%B9%E3%81%A7%E6%96%B0%E3%81%9F%E3%81%AA%E3%82%B9%E3%83%AA%E3%83%AB%E3%82%92!',	// 必須 関連番組タグ  初期値（-）	
//		exclude:0,	// 任意 番組除外 0(除外しない) 1(除外する) 初期値（1）	
//		sourceChannelType:3,	// 条件 検索元番組放送波 2(地上波)3(BS)120(CATV)200(コミュニティチャンネル) 初期値（-）	
//		sourceServiceCode:'29752_32295',	// 任意 検索元番組サービスコード  初期値（-）	
//		sourceEventId:40273,	// 任意 検索元番組イベントID  初期値（-）	
//		sourceProgramDate:20130911,	// 任意 検索元番組放送日  初期値（-）	
//		areaId:30,	// 必須 エリアID  初期値（-）	
//		serviceCode:'191_4,570_65406',	// 任意 サービスコード  初期値（-）	
//		genreId:'62,4',	// 任意 ジャンルID  初期値（-）	
//		since:'201702011200',	// 任意 放送日（開始）  初期値（現在日時）	
//		until:'201702811200',	// 任意 放送日（終了）  初期値（-）	
//		adult:1,	// 任意 アダルトチャンネル制御 0(含めない) 1(含める) 初期値（0）	
//		limit:50,	// 任意 最大取得件数  初期値（20）	
	};
		
	//	制御用パラメータ
	var statusObj = {	
		uid:0,	//	UID
		container:'.lane_wrp_05 .slick_slider',		//番組表格納コンテナ
		container_parent:'.lane_wrp_05',	// 親要素
		callback:'loadLane05Complete',	// コールバック関数 デフォルト：searchProgramAPIComplete 省略可
		useRecommend:1,// おすすめ番組フラグを利用 0（しない：デフォルト）,1（する）
	};
		
	//	データ呼び出し
  getJcomRelatedProgramList(searchObj,statusObj);
	
}

//	関連番組API：読み込み完了
function loadLane05Complete(result,status,searchObj,statusObj){
	trace("関連番組API：読み込み完了　"+status);
	trace(result);
	
	var slider = $(statusObj.container);
	var parent =  $(statusObj.container_parent);
	var html = "";
	var option;
	var class_name;
	
	//	番組情報がなければ非表示
	if(result.length == 0 || status != 0 ){
		parent.hide();
		parent.addClass('nodata');
		return;
	} 
	
	//	番組の数によって設定を調整
	var sliderObj = getSliderDataAndStatus(result);
	var data = sliderObj.data;
	var option = sliderObj.option;
	var class_name = sliderObj.class_name;
	parent.addClass(class_name);
	//	スライダーの管理に登録
	sliderObj.slider = slider;
	addSliderObjList(sliderObj);
	
	
	trace("関連番組API：parent　");
	trace(parent);
	
	//	HTMLを作成
	var loop = data.length;
	for(var i=0;i<loop;i++){

		//	API種別によってフォーマットを調整
		var myData = getMyDataByRelatedProgramAPI(data[i]);

		//	データからHTMLを生成、コピーライトの追加
		html += createLaneSliderHTML(myData);
		addCopyrightSection(myData.copyright);
	}//	for	
	
	//	準備完了
	slider.addClass("loaded");
	slider.html(html);
	
	//	スライダー起動
	slider.slick(option);
	
}//

/*--------------------------------------------------------------

	韓流・華流イケメン俳優（関連番組API）lane_wrp_06

--------------------------------------------------------------*/
//	関連番組API：読み込み
function loadLane06(){
	trace("loadLane06");
	
	//	APIパラメータ
	var searchObj = {
		//韓流・華流イケメン俳優
    tag:'%E9%9F%93%E6%B5%81%E3%83%BB%E8%8F%AF%E6%B5%81%E3%82%A4%E3%82%B1%E3%83%A1%E3%83%B3%E4%BF%B3%E5%84%AA%E3%81%AF%E5%A5%BD%E3%81%8D%E3%81%A7%E3%81%99%E3%81%8B%3F',
//		tag:'%E9%9F%93%E5%9B%BD%E3%83%AD%E3%83%9E%E3%83%B3%E3%83%86%E3%82%A3%E3%83%83%E3%82%AF%E3%82%B3%E3%83%A1%E3%83%87%E3%82%A3',	// 必須 関連番組タグ  初期値（-）	
//		exclude:0,	// 任意 番組除外 0(除外しない) 1(除外する) 初期値（1）	
//		sourceChannelType:3,	// 条件 検索元番組放送波 2(地上波)3(BS)120(CATV)200(コミュニティチャンネル) 初期値（-）	
//		sourceServiceCode:'29752_32295',	// 任意 検索元番組サービスコード  初期値（-）	
//		sourceEventId:40273,	// 任意 検索元番組イベントID  初期値（-）	
//		sourceProgramDate:20130911,	// 任意 検索元番組放送日  初期値（-）	
//		areaId:30,	// 必須 エリアID  初期値（-）	
//		serviceCode:'191_4,570_65406',	// 任意 サービスコード  初期値（-）	
//		genreId:'62,4',	// 任意 ジャンルID  初期値（-）	
//		since:'201702011200',	// 任意 放送日（開始）  初期値（現在日時）	
//		until:'201702811200',	// 任意 放送日（終了）  初期値（-）	
//		adult:1,	// 任意 アダルトチャンネル制御 0(含めない) 1(含める) 初期値（0）	
//		limit:50,	// 任意 最大取得件数  初期値（20）	
	};
		
	//	制御用パラメータ
	var statusObj = {	
		uid:0,	//	UID
		container:'.lane_wrp_06 .slick_slider',		//番組表格納コンテナ
		container_parent:'.lane_wrp_06',	// 親要素
		callback:'loadLane06Complete',	// コールバック関数 デフォルト：searchProgramAPIComplete 省略可
		useRecommend:1,// おすすめ番組フラグを利用 0（しない：デフォルト）,1（する）
	};
		
	//	データ呼び出し
  getJcomRelatedProgramList(searchObj,statusObj);
	
}

//	関連番組API：読み込み完了
function loadLane06Complete(result,status,searchObj,statusObj){
	trace("関連番組API：読み込み完了　"+status);
	trace(result);
	
	var slider = $(statusObj.container);
	var parent =  $(statusObj.container_parent);
	var html = "";
	var option;
	var class_name;
	
	//	番組情報がなければ非表示
	if(result.length == 0 || status != 0 ){
		parent.hide();
		parent.addClass('nodata');
		return;
	} 
	
	//	番組の数によって設定を調整
	var sliderObj = getSliderDataAndStatus(result);
	var data = sliderObj.data;
	var option = sliderObj.option;
	var class_name = sliderObj.class_name;
	parent.addClass(class_name);
	//	スライダーの管理に登録
	sliderObj.slider = slider;
	addSliderObjList(sliderObj);
	
	//	HTMLを作成
	var loop = data.length;
	for(var i=0;i<loop;i++){

		//	API種別によってフォーマットを調整
		var myData = getMyDataByRelatedProgramAPI(data[i]);

		//	データからHTMLを生成、コピーライトの追加
		html += createLaneSliderHTML(myData);
		addCopyrightSection(myData.copyright);
	}//	for	
	
	//	準備完了
	slider.addClass("loaded");
	slider.html(html);
	
	//	スライダー起動
	slider.slick(option);
	
}//

/*--------------------------------------------------------------

	時代劇？？（関連番組API）lane_wrp_07

--------------------------------------------------------------*/
//	関連番組API：読み込み
function loadLane07(){
	trace("loadLane07");
	
	//	APIパラメータ
	var searchObj = {
    //韓国ロマンティックコメディ
		tag:'韓ドラ時代劇',	// 必須 関連番組タグ  初期値（-）	
//		exclude:0,	// 任意 番組除外 0(除外しない) 1(除外する) 初期値（1）	
//		sourceChannelType:3,	// 条件 検索元番組放送波 2(地上波)3(BS)120(CATV)200(コミュニティチャンネル) 初期値（-）	
//		sourceServiceCode:'29752_32295',	// 任意 検索元番組サービスコード  初期値（-）	
//		sourceEventId:40273,	// 任意 検索元番組イベントID  初期値（-）	
//		sourceProgramDate:20130911,	// 任意 検索元番組放送日  初期値（-）	
//		areaId:30,	// 必須 エリアID  初期値（-）	
//		serviceCode:'191_4,570_65406',	// 任意 サービスコード  初期値（-）	
//		genreId:'62,4',	// 任意 ジャンルID  初期値（-）	
//		since:'201702011200',	// 任意 放送日（開始）  初期値（現在日時）	
//		until:'201702811200',	// 任意 放送日（終了）  初期値（-）	
//		adult:1,	// 任意 アダルトチャンネル制御 0(含めない) 1(含める) 初期値（0）	
//		limit:50,	// 任意 最大取得件数  初期値（20）	
	};
		
	//	制御用パラメータ
	var statusObj = {	
		uid:0,	//	UID
		container:'.lane_wrp_07 .slick_slider',		//番組表格納コンテナ
		container_parent:'.lane_wrp_07',	// 親要素
		callback:'loadLane07Complete',	// コールバック関数 デフォルト：searchProgramAPIComplete 省略可
		useRecommend:1,// おすすめ番組フラグを利用 0（しない：デフォルト）,1（する）
	};
		
	//	データ呼び出し
  getJcomRelatedProgramList(searchObj,statusObj);
	
}

//	関連番組API：読み込み完了
function loadLane07Complete(result,status,searchObj,statusObj){
	trace("関連番組API：読み込み完了　"+status);
	trace(result);
	
	var slider = $(statusObj.container);
	var parent =  $(statusObj.container_parent);
	var html = "";
	var option;
	var class_name;
	
	//	番組情報がなければ非表示
	if(result.length == 0 || status != 0 ){
		parent.hide();
		parent.addClass('nodata');
		return;
	} 
	
	//	番組の数によって設定を調整
	var sliderObj = getSliderDataAndStatus(result);
	var data = sliderObj.data;
	var option = sliderObj.option;
	var class_name = sliderObj.class_name;
	parent.addClass(class_name);
	//	スライダーの管理に登録
	sliderObj.slider = slider;
	addSliderObjList(sliderObj);
	
	//	HTMLを作成
	var loop = data.length;
	for(var i=0;i<loop;i++){

		//	API種別によってフォーマットを調整
		var myData = getMyDataByRelatedProgramAPI(data[i]);

		//	データからHTMLを生成、コピーライトの追加
		html += createLaneSliderHTML(myData);
		addCopyrightSection(myData.copyright);
	}//	for	
	
	//	準備完了
	slider.addClass("loaded");
	slider.html(html);
	
	//	スライダー起動
	slider.slick(option);
	
}//

/*--------------------------------------------------------------

	人気アイドル出演（関連番組API）lane_wrp_08

--------------------------------------------------------------*/
//	関連番組API：読み込み
function loadLane08(){
	trace("loadLane08");
	
	//	APIパラメータ
	var searchObj = {
    //K-POPファン必見!人気アイドル出演ドラマ!
		tag:'K-POP%E3%83%95%E3%82%A1%E3%83%B3%E5%BF%85%E8%A6%8B!%E4%BA%BA%E6%B0%97%E3%82%A2%E3%82%A4%E3%83%89%E3%83%AB%E5%87%BA%E6%BC%94%E3%83%89%E3%83%A9%E3%83%9E!',	// 必須 関連番組タグ  初期値（-）	
//		exclude:0,	// 任意 番組除外 0(除外しない) 1(除外する) 初期値（1）	
//		sourceChannelType:3,	// 条件 検索元番組放送波 2(地上波)3(BS)120(CATV)200(コミュニティチャンネル) 初期値（-）	
//		sourceServiceCode:'29752_32295',	// 任意 検索元番組サービスコード  初期値（-）	
//		sourceEventId:40273,	// 任意 検索元番組イベントID  初期値（-）	
//		sourceProgramDate:20130911,	// 任意 検索元番組放送日  初期値（-）	
//		areaId:30,	// 必須 エリアID  初期値（-）	
//		serviceCode:'191_4,570_65406',	// 任意 サービスコード  初期値（-）	
//		genreId:'62,4',	// 任意 ジャンルID  初期値（-）	
//		since:'201702011200',	// 任意 放送日（開始）  初期値（現在日時）	
//		until:'201702811200',	// 任意 放送日（終了）  初期値（-）	
//		adult:1,	// 任意 アダルトチャンネル制御 0(含めない) 1(含める) 初期値（0）	
//		limit:50,	// 任意 最大取得件数  初期値（20）	
	};
		
	//	制御用パラメータ
	var statusObj = {	
		uid:0,	//	UID
		container:'.lane_wrp_08 .slick_slider',		//番組表格納コンテナ
		container_parent:'.lane_wrp_08',	// 親要素
		callback:'loadLane08Complete',	// コールバック関数 デフォルト：searchProgramAPIComplete 省略可
		useRecommend:1,// おすすめ番組フラグを利用 0（しない：デフォルト）,1（する）
	};
		
	//	データ呼び出し
  getJcomRelatedProgramList(searchObj,statusObj);
	
}

//	関連番組API：読み込み完了
function loadLane08Complete(result,status,searchObj,statusObj){
	trace("関連番組API：読み込み完了　"+status);
	trace(result);
	
	var slider = $(statusObj.container);
	var parent =  $(statusObj.container_parent);
	var html = "";
	var option;
	var class_name;
	
	//	番組情報がなければ非表示
	if(result.length == 0 || status != 0 ){
		parent.hide();
		parent.addClass('nodata');
		return;
	} 
	
	//	番組の数によって設定を調整
	var sliderObj = getSliderDataAndStatus(result);
	var data = sliderObj.data;
	var option = sliderObj.option;
	var class_name = sliderObj.class_name;
	parent.addClass(class_name);
	//	スライダーの管理に登録
	sliderObj.slider = slider;
	addSliderObjList(sliderObj);
	
	//	HTMLを作成
	var loop = data.length;
	for(var i=0;i<loop;i++){

		//	API種別によってフォーマットを調整
		var myData = getMyDataByRelatedProgramAPI(data[i]);

		//	データからHTMLを生成、コピーライトの追加
		html += createLaneSliderHTML(myData);
		addCopyrightSection(myData.copyright);
	}//	for	
	
	//	準備完了
	slider.addClass("loaded");
	slider.html(html);
	
	//	スライダー起動
	slider.slick(option);
	
}//

/*--------------------------------------------------------------

	J:COMオンデマンド 見逃し配信（オンデマンドAPI（VOD））lane_wrp_09

--------------------------------------------------------------*/
//	読み込み
function loadLane09(){
	trace("loadLane09");
	//	APIパラメータ
	var searchObj = {
//    keyword:'韓 見】',
    limit:12,
    category:'jmc/v200904/kyodopack/drama/china',
    flagInitialEpisodeOnly:1,
    kindHishinbi:0,
    flagOr:0,
    flagMuryo:0,
    sort:2,
    r18:0,
  };	
		
	//	制御用パラメータ
	var statusObj = {
    uid:0,	//	UID
		container:'.lane_wrp_09 .slick_slider',		//番組表格納コンテナ
		container_parent:'.lane_wrp_09',	// 親要素
    ngwords:[],
    callback:'loadLane09Complete',	// コールバック関数 デフォルト：searchProgramAPIComplete 省略可
  };
		
	//	データ呼び出し
	getJcomOndemandList(searchObj,statusObj);
}

//	読み込み
function loadLane09_2(){
	trace("loadLane09_2");
	//	APIパラメータ
	var searchObj = {
//    keyword:'韓 見】',
    limit:12,
    category:'jmc/v200904/kyodopack/drama/kmovie',
    flagInitialEpisodeOnly:1,
    kindHishinbi:0,
    flagOr:0,
    flagMuryo:0,
    sort:2,
    r18:0,
  };	
		
	//	制御用パラメータ
	var statusObj = {
    uid:0,	//	UID
		container:'.lane_wrp_09_2 .slick_slider',		//番組表格納コンテナ
		container_parent:'.lane_wrp_09_2',	// 親要素
    ngwords:[],
    callback:'loadLane09Complete',	// コールバック関数 デフォルト：searchProgramAPIComplete 省略可
  };
		
	//	データ呼び出し
	getJcomOndemandList(searchObj,statusObj);
}


//	読み込み
/*function loadLane09_3(){
	trace("loadLane09_3");
	//	APIパラメータ
	var searchObj = {
//    keyword:'韓 見】',
    limit:12,
    category:'jmc/v200904/kyodopack/drama/korean',
    flagInitialEpisodeOnly:0,
    kindHishinbi:0,
    flagOr:0,
    flagMuryo:0,
    sort:1,
    r18:0,
  };	
		
	//	制御用パラメータ
	var statusObj = {
    uid:0,	//	UID
		container:'.lane_wrp_09_3 .slick_slider',		//番組表格納コンテナ
		container_parent:'.lane_wrp_09_3',	// 親要素
    ngwords:[],
    callback:'loadLane09Complete',	// コールバック関数 デフォルト：searchProgramAPIComplete 省略可
  };
		
	//	データ呼び出し
	getJcomOndemandList(searchObj,statusObj);
}*/

//	VOD：読み込み完了
function loadLane09Complete(result,status,searchObj,statusObj){
	trace("VOD：読み込み完了");
	trace(result);

	var slider = $(statusObj.container);
	var parent =  $(statusObj.container_parent);
	var html = "";
	var option;
	var class_name;
	
	//	番組情報がなければ非表示
	if(result.length == 0 || status != 0 ){
		parent.hide();
		parent.addClass('nodata');
		return;
	} 
	
	//	番組の数によって設定を調整
	var sliderObj = getSliderDataAndStatus(result);
	var data = sliderObj.data;
	var option = sliderObj.option;
	var class_name = sliderObj.class_name;
	parent.addClass(class_name);
	//	スライダーの管理に登録
	sliderObj.slider = slider;
	addSliderObjList(sliderObj);
	
	//	HTMLを作成
	var loop = data.length;
	for(var i=0;i<loop;i++){
		
		//	API種別によってフォーマットを調整
		var myData = getMyDataByVODAPI(data[i]);
		
		//	データからHTMLを生成、コピーライトの追加
		html += createLaneSliderHTML(myData);
		addCopyrightSection(myData.copyright);
	}//	for	
	
	//	準備完了
	slider.addClass("loaded");
	slider.html(html);
	
	//	スライダー起動
	slider.slick(option);
	
}//


/*--------------------------------------------------------------

	プレゼント（イベプレAPI）lane_wrp_10

--------------------------------------------------------------*/
//	イベプレAPI：読み込み
function loadLane10(){
	trace("loadLane10");
	
	//	APIパラメータ
	var searchObj = {
			title: "",
			addKeywords: "%韓流アジアドラマ%",
			mso: "",
			channel: "",
			magazine: "",
			limit: "",
			order: ""
	};
		
	//	制御用パラメータ
	var statusObj = {	
		uid:0,	//	UID
		container:'.lane_wrp_10 .slick_slider',		//番組表格納コンテナ
		container_parent:'.lane_wrp_10',	// 親要素
		callback:'loadLane10Complete',	// コールバック関数 デフォルト：searchProgramAPIComplete 省略可
		addCC:false,	//	リンクにccを追加するか
		ignoreDate:false,	//	掲載開始時期前、または掲載開始時時期が未設定でも表示する（true）表示しない（false）		
	};
		
	//	データ呼び出し
  getJcomEventPresentList(searchObj,statusObj);
	
}

//	イベプレAPI：読み込み完了
function loadLane10Complete(result,status,searchObj,statusObj){
	trace("イベプレAPI：読み込み完了　"+status);
	trace(result);
	
	var slider = $(statusObj.container);
	var parent =  $(statusObj.container_parent);
	var html = "";
	var option;
	var class_name;
	
	//	番組情報がなければ非表示
	if(result.length == 0 || status != "success" ){
		//parent.hide();
		slider.addClass('nodata');
		slider.html("<p>現在応募できるイベント・プレゼント情報はありません。</p>");
		return;
	}
  
	//	番組の数によって設定を調整
	var sliderObj = getSliderDataAndStatus(result);
	var data = sliderObj.data;
	var option = sliderObj.option;
	var class_name = sliderObj.class_name;
	//	スライダーの管理に登録
	sliderObj.slider = slider;
	addSliderObjList(sliderObj);	
	
	parent.addClass(class_name);
	
	
	//	HTMLを作成
	var loop = data.length;
	for(var i=0;i<loop;i++){

		//	API種別によってフォーマットを調整
		var myData = getMyDataByEventPresentAPI(data[i]);

		//	データからHTMLを生成、コピーライトの追加
		html += createLaneSliderHTML(myData);
		addCopyrightSection(myData.copyright);
	}//	for	
	
	//	準備完了
	slider.addClass("loaded");
	slider.html(html);
	
	//	スライダー起動
	slider.slick(option);
	
}//


/*==============================================================

  フォーマットを合わせる
	
--------------------------------------------------------------*/
/* マスターAPI */
function getMyDataByMasterAPI(myData){
	var linkUrl = myData.url;
	var imageUrl = myData.photo;
	var next_date_short = myData.next_date_short.split(' ');
	var end_time = myData.end_time;
	var date = next_date_short[0]+" "+next_date_short[1]+"〜"+end_time;
	var label = myData.channelName;
	if(imageUrl.indexOf("no_image") !== -1){
		imageUrl = myData.channelLogoUrl;
	}
	myData.linkUrl = linkUrl;
	myData.imageUrl = imageUrl;
	myData.date = date;
	myData.label = label;
	
	return myData;
}

/* 番組表API */
function getMyDataByProgramAPI(myData){
	var linkUrl = myData.url;
	var imageUrl = myData.photo;
	var date = myData.datestr_simple_single2+" "+myData.startTime+"〜"+myData.endTime;
	var label = myData.channelName;

	if(imageUrl.indexOf("no_image") !== -1){
		imageUrl = myData.channelLogoUrl;
	}
	myData.linkUrl = linkUrl;
	myData.imageUrl = imageUrl;
	myData.date = date;
	myData.label = label;
	
	return myData;
}

/* 関連番組API */
function getMyDataByRelatedProgramAPI(myData){
	var linkUrl = myData.url;
	var imageUrl = myData.photo;
	var date = myData.datestr_simple_single2+" "+myData.startTime+"〜"+myData.endTime;
	var label = myData.channelName;

	if(imageUrl.indexOf("no_image") !== -1){
		imageUrl = myData.channelLogoUrl;
	}
	myData.linkUrl = linkUrl;
	myData.imageUrl = imageUrl;
	myData.date = date;
	myData.label = label;
	
	return myData;
}

/* おすすめAPI */
function getMyDataByRecommendProgramAPI(myData){
	
	var linkUrl = myData.kijiurl;
	var imageUrl = myData.thumbnail;
	var date = myData.datestr_simple_single2+" "+myData.startTime+"〜"+myData.endTime;
	var label = myData.channelName;

	if(imageUrl.indexOf("no_image") !== -1){
		imageUrl = myData.channelLogoUrl;
	}
	myData.linkUrl = linkUrl;
	myData.imageUrl = imageUrl;
	myData.date = date;
	myData.label = label;
	myData.rank = undefined;
	
	return myData;
}

/* ランキングAPI */
function getMyDataByRankingAPI(myData){

	var linkUrl = myData.url;
	var imageUrl = myData.photo;
//	var date = myData.datestr_simple_single2+" "+myData.startTime+"〜"+myData.endTime;
	var label = myData.channelName;

	if(imageUrl.indexOf("no_image") !== -1){
		if(myData.channelLogoUrl){
			imageUrl = myData.channelLogoUrl;
		}else{
			if(myData.defaultChannelLogoUrl){
				imageUrl = myData.defaultChannelLogoUrl;
			}			
		}
	}
	
	if(myData.channelName){
		myData.label = myData.channelName;
	}
	
	myData.rank = myData.rank+"位";
	myData.linkUrl = linkUrl;
	myData.imageUrl = imageUrl;
	
	return myData;
}

/* イベプレAPI */
function getMyDataByEventPresentAPI(myData){

	var linkUrl = myData.link;
	var imageUrl = myData.iconImagePath;
	var label = '';
	
	if(myData.channel != ''){
		var channelList = myData.channel.split(',');
		var len = channelList.length;
		for(var i=0;i<len;i++){
			var channel = getChannelIDForEventPresentByID(channelList[i]);		
			if(channel != undefined){
				if(i != 0) label += ',';
				label += channel;
			}
		}//	for		
	}
		
	if(label != ''){
		myData.label = label;
	}

	myData.linkUrl = linkUrl;
	myData.imageUrl = imageUrl;
	
	return myData;
}


/* VOD API */
function getMyDataByVODAPI(myData){
	var assetId = myData.assetId.replace(/\s+/g, "");
	var linkUrl = "https://linkvod.myjcom.jp/video/"+assetId+"?isasset=true";
	var imageUrl = myData.Thumbnail;
	myData.title = myData.Title;
	myData.linkUrl = linkUrl;
	myData.imageUrl = imageUrl;
	myData.label = 'J:COM STREAM';

	return myData;
}



/*--------------------------------------------------------------

	スライダー番組の数によって設定を調整

--------------------------------------------------------------*/
function getSliderDataAndStatus(result){
	trace("スライダー番組の数によって設定を調整 "+result.length);
	
	var data;
	var option;
	var class_name;
	var len = result.length;

	if(len == 1){
		data = result;
		class_name = 'slider_sp_only';
		option = slickOptions.slickOnlyOne;		
	}else if(len == 2){
		data = result;
		class_name = 'slider_sp_only';
		option = slickOptions.slickOnlySP;
	}else if(3 <= len && len < 5){
		data = result;
		class_name = 'slider_sp_tablet';
		option = slickOptions.slickOnlySPTab;
	}else{
		class_name = 'slider_normal';
		option = slickOptions.slickNormal;
		if(len <= 5){
			data = result.concat(result);
		}else{
			data = result;
		}
	}
	
	var obj = {
		data:data,
		option:option,
		class_name:class_name
	}
	
	trace(obj);
	
	return obj;
}



/*--------------------------------------------------------------
  コピーライトに追加
--------------------------------------------------------------*/
function addCopyrightSection(copyright){
	if($('.program_copyright')){
		
		if(copyright != undefined) $('.program_copyright').append(copyright+' ');
	}
}
/*--------------------------------------------------------------
	重複を削除してコピーライト追加　！未使用
--------------------------------------------------------------*/
function setAndAddCopyright(list){
	var copyrightList = Array.from(new Set(list));
	var len = copyrightList.length;
	for(var i=0;i<len;i++){
		addCopyrightSection(copyrightList[i]);
	}//	for
}


/*--------------------------------------------------------------

	スライダーの管理　！未使用

--------------------------------------------------------------*/
var slickSliderObjList = [];

function addSliderObjList(sliderObj){
	
	if(slickSliderObjList.length == 0){
		//	初回
		addChangeDeviceEvent('resetSlickSliders');
	}
	
	sliderObj.slider.on('destroy', function(event, slick) {
		trace("スライダーを削除");
	});
	
	slickSliderObjList.push(sliderObj);
}

function resetSlickSliders(){
	trace("resetSlickSliders "+device);
	
	var len = slickSliderObjList.length;

	for(var i=0;i<len;i++){
		var sliderObj = slickSliderObjList[i];
		var slider = sliderObj.slider;
		var option = sliderObj.option;
		var class_name = sliderObj.class_name;
		
		if(class_name != 'slider_normal'){
			slider.slick('unslick');
			slider.slick(option);			
		}

	}//	for
}


/*--------------------------------------------------------------

共通　レーンのHTML作成
	
--------------------------------------------------------------*/

//	番組表マスターAPI：HTML作成
function createLaneSliderHTML(data){
	//trace("------------ createLaneSliderHTML");

	var html = "";
	var onclick_tag = ' onclick="s.jcomCustomLinkTrack({\'trackValue\':this.href});"';
	var deactive_link = "";
	if (typeof(data.hasNextBroadcast) !== 'undefined') {
		if(!data.hasNextBroadcast){
			deactive_link = ' deactive_link';
		}
	}
	
	var hasLink = true;
	
	html += "<div class='slide'>";
	
	var target = "";
	if (typeof(data.target) !== 'undefined') {
		target = ' target="_blank"';
	}
	
	if(typeof(data.linkUrl) !== 'undefined') {
		if(data.linkUrl == ""){
			hasLink = false;
			deactive_link = ' deactive_link';
			onclick_tag = '';
		}
		html += " <a href='"+data.linkUrl+"' class='"+deactive_link+"'"+target+onclick_tag+">";
	}else{
		hasLink = false;
	}
	
	
	html += "	<div class='item'>";
	html += "		<div class='photo'>";
	html += "			<img src='"+data.imageUrl+"' alt=''>";
	html += "		</div>";
	html += "		<div class='txt'>";
	
	if(typeof(data.rank) !== 'undefined') {
		html += "			<div class='rank'>"+data.rank+"</div>";
	}
	
	if(typeof(data.eventPresent) !== 'undefined') {
		html += "			<div class='eventPresent'>"+data.eventPresent+"</div>";
	}
	if(typeof(data.magazine) !== 'undefined') {
		html += "			<div class='magazine'>"+data.magazine+"</div>";
	}
	
	html += "			<div class='title'>"+data.title+" </div>";
	
	if(typeof(data.date) !== 'undefined') {
		var date_class = 'date';
		
		if(typeof(data.nowonair) !== 'undefined') {
			if(data.nowonair){
				date_class = 'date now_on_air';
			}
		}
		html += "			<div class='"+date_class+"'>"+data.date+"</div>";
	}
	if(typeof(data.label) !== 'undefined') {
		html += "			<div class='ch_name'>"+data.label+"</div>";
	}
	
	html += "		</div>";
	html += "	</div>";

	if(hasLink) {
		html += "</a>";
	}
	html += "</div>";
	
  return html;

}


/*--------------------------------------------------------------

	スライダー設定
	
--------------------------------------------------------------*/
var slickOptions = {
  // PC, TAB レイアウト時のみ Slick を適用
  slickOnlyPcAndTab: {
    autoplay: true, ////////////
    centerMode: true,
    infinite: true,
    pauseOnFocus: false,
    pauseOnHover: false,
    variableWidth: true,
    responsive: [
      {
        breakpoint: 800,
        settings: 'unslick',
      },
      {
        breakpoint: 1119,
        settings: {
          arrows: true,
        },
      },
      {
        breakpoint: 1920,
        settings: {
          arrows: true,
        },
      },
    ],
  },
  // 通常の slick オプション
  slickNormal: {
    arrows: true,
    //autoplay: true,
    autoplay: true, ////////////
    autoplaySpeed: 4000,
    speed: 400,
    centerMode: true,
    dots: false,
    infinite: true,
    pauseOnFocus: false,
    pauseOnHover: false,
    slidesToShow: 5,
    variableWidth: true,
    responsive: [
      {
        breakpoint: 800,
        settings: {
          arrows: false,
        },
      },
    ],
  },
  // TAB SPのみスライダー
  slickOnlySPTab: {
    centerMode: true,
    infinite: false,
    pauseOnFocus: false,
    pauseOnHover: false,
    variableWidth: true,
    slidesToShow: 2,
    arrows: false,
    responsive: [
      {
        breakpoint: 1070,
        settings: {
          arrows: true,
          infinite: true,
          slidesToShow: 1,
        },
      },
      {
        breakpoint: 1920,
        settings: 'unslick',
      },
    ],
  },
  // SPのみスライダー
	slickOnlySP: {
    centerMode: true,
    infinite: false,
    pauseOnFocus: false,
    pauseOnHover: false,
    variableWidth: true,
    slidesToShow: 2,
    arrows: false,
    responsive: [
      {
        breakpoint: 800,
        settings: {
          arrows: false,
          infinite: true,
          slidesToShow: 1,
        },
      },
      {
        breakpoint: 801,
        settings: 'unslick',
      },
      {
        breakpoint: 1920,
        settings: 'unslick',
      },
    ],
  },
  // 1枚
  slickOnlyOne: {
    centerMode: true,
    infinite: true,
    pauseOnFocus: false,
    pauseOnHover: false,
    variableWidth: true,
    slidesToShow: 1,
//    responsive: [
//      {
//        breakpoint: 800,
//        settings: 'unslick',
//      },
//      {
//        breakpoint: 801,
//        settings: 'unslick',
//      },
//      {
//        breakpoint: 1920,
//        settings: 'unslick',
//      },
//    ],		
  },
  //
};

//var lane_slider_option = {
//		//dots: true, //ページネーション
//		speed: 500, // 切り替わりのスピード
//		autoplay: true, //自動スライド
//		autoplaySpeed: 2000, //自動スライドのスピード
//		infinite: true, //永遠にスライド
//		centerMode: true, //センター表示（センターモードではslideToScrollは効かない）
//		//centerPadding: '0',//左右のパディング
//		//slidesToShow: 3, //3画像表示
//		slidesToScroll: 1, //1画像分スライド
//		//vertical: true, //縦スライド
//		variableWidth: true,
//		responsive: [{
//			breakpoint: 800,settings: {
//				arrows: false,
//			}
//		}]
//	};

/*--------------------------------------------------------------

	//slickスライダー（バナー）
	if($('.lane_wrp_bnr')[0]){
		loadLaneBnr();
	}	

--------------------------------------------------------------*/
function loadLaneBnr(){

  var wrp = $('.lane_wrp_bnr');
  var section = wrp.parent('.section');
  var slider = wrp.find('.slick_slider');
  var item_len = slider.find('.c-slickScrollList_item').length;
  //trace('item_len:' + item_len);
  
  
  //アイテムが0なら非表示
	if(item_len == 0 ){
		section.hide();
		return;
	}
  
  //アイテムが1つ
  if(item_len == 1){
    wrp.addClass('slider_sp_only');
    slider.slick({
      dots: false,
      centerMode: true,
      infinite: true,
      pauseOnFocus: false,
      pauseOnHover: false,
      variableWidth: true,
      slidesToShow: 1,
    });
    //trace('item_len:1');
    
  //アイテムが2つ  
	}else if(item_len == 2){
    wrp.addClass('slider_sp_only');
    slider.slick({
      speed: 400,
      dots: true,
      centerMode: true,
      infinite: false,
      pauseOnFocus: false,
      pauseOnHover: false,
      variableWidth: true,
      slidesToShow: 2,
      arrows: false,
      responsive: [
        {
          breakpoint: 800,
          settings: {
            arrows: false,
            infinite: true,
            slidesToShow: 1,
          },
        },
        {
          breakpoint: 801,
          settings: 'unslick',
        },
        {
          breakpoint: 9999,
          settings: 'unslick',
        },
      ],
    });
    //trace('item_len:2');
   
  //アイテムが3つ    
	}else if(item_len == 3){
    wrp.addClass('slider_sp_tablet');
    slider.slick({
      speed: 400,
      dots: true,
      centerMode: true,
      infinite: false,
      pauseOnFocus: false,
      pauseOnHover: false,
      variableWidth: true,
      slidesToShow: 2,
      arrows: false,
      responsive: [
        {
          breakpoint: 1070,
          settings: {
            arrows: true,
            infinite: true,
            slidesToShow: 1,
          },
        },
        {
          breakpoint: 9999,
          settings: 'unslick',
        },
      ],
    });
    //trace('item_len:3');
   
  //アイテムが4つ以上    
	}else{
    wrp.addClass('slider_normal');
		slider.slick({
      speed: 400,
      dots: true,
      centerMode: true,
      infinite: true,
      pauseOnFocus: false,
      pauseOnHover: false,
      variableWidth: true,
      slidesToShow: 3,
      arrows: true,
      responsive: [
        {
          breakpoint: 800,
          settings: {
            arrows: false,
          },
        },
      ],
    });
    //trace('item_len:<=4');
    
	}
  
  $(window).on('resize orientationchange', function () {
    slider.slick('resize');
  });
	
}


/*--------------------------------------------------------------

	インタビュー詳細
	
--------------------------------------------------------------*/
function initInterviewDetail(){
	
	initInterviewProgram();
}


/*--------------------------------------------------------------

	インタビュー俳優　出演番組

--------------------------------------------------------------*/
//	番組表マスターAPI：読み込み
function initInterviewProgram(){
	trace("initInterviewProgram");
	var keyword;
	
	if(actor_name == ''){
		keyword = $('.interview_program_title').find('.title strong').html();
	}else{
		keyword = actor_name;
	}
	
	var queryType = 1;
	if (typeof interview_queryType !== 'undefined') {
		queryType = interview_queryType;
	}
	
	//	APIパラメータ
	var searchObj = {
			genreId:31,	// ジャンルID
			keyword:keyword,	//	検索ワード　APIではqueryで処理
			targetChannels:'0',		//	検索対象の放送波　0（CATV）、1（コミュチャン）、2（BS）、3（地デジ）カンマ区切りで複数設定可
			limit:20,
			queryType:queryType,
		};	
		
	//	制御用パラメータ
	var statusObj = {
			uid:0,	//	UID
			container:'.section_interview_program .program_item_list',
			nodata_hide:true,
			displayN:3,	//	もっと見るボタンを表示。指定数ずつ番組を表示する　省略可
			callback:'initInterviewProgramLoadComplete',	// コールバック関数 デフォルト：searchProgramAPIComplete 省略可
			useRecommend:0,// おすすめ番組フラグを利用 0（しない：デフォルト）,1（する）
		};	
	
	
	//	データ呼び出し
	getJcomProgramMasterList(searchObj,statusObj);
	
}


//	番組表マスターAPI：読み込み完了
function initInterviewProgramLoadComplete(result,status,searchObj,statusObj){
	trace("番組表マスターAPI：読み込み完了 "+status);
	trace(result);
	trace("status "+status);
	
	
	var container = $(statusObj.container);
	container.addClass("loaded");
	
	var html;
	if(status == 0){
		html = createProgramMasterListHTML(result,searchObj);
		container.find('.list').html(html);
	}else{
		trace("エラー");
		html = '<div class="no_data_box"><p class="errormessage">放送情報はありませんでした。<\/p><\/div>';
		container.html(html);
		return ;
	}

	
	
	var programlistMaxN = statusObj.displayN;
	var programlistAllShow = false;
	
	/* もっとみる	*/
	initShowMoreBtn();

	function initShowMoreBtn(){
		var listN = container.find('.program_item').length;
	
		if(programlistMaxN < listN) {
			hideProgramList();
			container.find('.show_more_btn a').click(function(){
				if(programlistAllShow){
					programlistAllShow = false;
					hideProgramList();
				}else{
					programlistAllShow = true;
					showProgramList();
				}
				return false;
			});

		}else{
			container.find('.show_more_btn a').hide();
		}

	}

	function hideProgramList(){
		var len = container.find('.program_item').length;
		for(var i=0;i<len;i++){
			var targetObj = container.find('.program_item:eq('+i+')');
			if(programlistMaxN <= i){
				targetObj.slideUp();
			}
		}//	for
		container.find('.show_more_btn a').html('もっと見る').removeClass('up_arw');
	}
	function showProgramList(){
		container.find('.program_item').slideDown();
		container.find('.show_more_btn a').html('表示を減らす').addClass('up_arw');
	}

}//

//var searchBtnURL = "";
//	番組表マスターAPI：HTML作成
function createProgramMasterListHTML(result,searchObj){
	trace("------------createProgramMasterListHTML");
	var html = "";// = '<div class="list">';
	 
	//var searchURL = (searchBtnURL=="") ? searchObj.searchBtnURL : searchBtnURL;
	var len = result.length; 
	var count = 0;
	
    for(var i=0;i<len;i++){        
        var title = result[i].title;
				var summary = result[i].summary;
        var channelName = result[i].channelName;
				var channelNo = result[i].channelNo;
				var channel_icon_url = getChannelLogoURL(channelName);
        var url = result[i].url;
        var photo;// = result[i].photo;
				var copyright = result[i].copyright;
				
				var photos = result[i].photos;
				var noimage = "";
				if(photos[0]){
					photo = result[i].photo;
				}else{
					noimage = " noimage";
					photo = channel_icon_url;
				}
				
			
				var copyrightTag = "";
				if(copyright != ""){
					copyrightTag = "		<div class='copyright'>"+copyright+"</div>";
				}
    
        
				html += "	<div class='program_item'>"
					+ "		<div class='thumb_block"+noimage+"'>"
					+ "			<img src='"+photo+"' alt=''>"
					+ "		</div>"
					+ "		<div class='info_block'>"
					+ "			<div class='txt'>"
					+ "				<h3 class='title'>"+title+"</h3>"
					+ "				<p class='summary'>"+summary+"</p>"
					+ "			</div>"
					+ "			<div class='program_info'>"
					+ "				<div class='channel'>"
					+ "					<div class='channel_icon'><img src='"+channel_icon_url+"' alt=''></div>"
					+ "					<div class='channel_txt'>"
					+ "						<div class='channel_no'>"+channelNo+"</div>"
					+ "					<div class='channel_name'>"+channelName+"</div>"
					+ "					</div>"
					+ "				</div>"
					+ "				<div class='btn'><a href='"+url+"' target='_blank'>放送情報はこちら</a></div>"
					+ "			</div>"
					+ "		</div>"
					+ copyrightTag
					+ "	</div>";
			
        count++;
    }//    for

//    html += '</div>';
   html += '<div class="show_more_btn"><a href="#">もっと見る<\/a><\/div> ';
    
	if(count == 0){
		html = '<div class="no_data_box"><p class="errormessage">番組情報はありませんでした。<\/p><\/div>';
	}
    return html;
}


/*--------------------------------------------------------------

	addClassNewitem

--------------------------------------------------------------*/
function addClassNewitem(){
  
  //	トップ
  if ($('.columnlist')[0]){
    setTimeout(function(){
      $('.columnlist .item:first').addClass('item_new');
    },200);
	}
}

/*--------------------------------------------------------------

	高さ調整の実施
	リサイズなどのタイミングでinitAlignHeightを着火させる
	
--------------------------------------------------------------*/	
function setAlignHeightEvent(){
	initAlignHeight('alignHeight','gridconatiner','grid','adjuster');	
}

function setAlignHeightEvent2(){
	initAlignHeight('listwrp','listwrp','listitem','adjuster');	
}

function setAlignHeightEvent3(){
	initAlignHeight('listwrp2','listwrp2','listitem','adjuster');	
}


/*--------------------------------------------------------------

	高さ調整　2016/7/25
	initAlignHeight (要素のラッパ,全体の幅を持つ要素,並ぶ要素,調整する対象)
	
--------------------------------------------------------------*/
var divN;
var wrpObj_arr = [];
var adjusterHeight_arr = [];
var count = 0;
function initAlignHeight (wrpper,widthcontent,container,adjuster){
	var len = $('.'+wrpper).length;
	trace("initAlignHeight "+len+"  "+wrpper);
	for(var i=0;i<len;i++){
		var listObj = $('.'+wrpper+':eq('+i+')');
		initAlignListObj(listObj,widthcontent,container,adjuster)
	}
}

function initAlignListObj(listObj,widthcontent,container,adjuster){
	wrpObj_arr = [];
	adjusterHeight_arr = [];
	count = 0;
	
	var contentW = $('.'+widthcontent).width();
	var itemW = listObj.find('.'+container+':eq(0)').width();
	var num = contentW/itemW;
	divN = Math.floor(num);	
	if(98 < (num - divN)*100) divN++; //	幅を%指定で、割り切れなかった場合、0.98以上は+1する。
	
	var len = listObj.find('.'+container).length;
	var limit = (len) % divN;
	var lastN = len-limit;
	
	for(var i=0;i<len;i++){
		var wrpObj = listObj.find('.'+container+':eq('+i+')');
		if(lastN < (i+1)){
			setListHeight(wrpObj,i,limit,adjuster);
		}else{
			setListHeight(wrpObj,i,divN,adjuster);
		}
	}//	for
}
function setListHeight(wrpObj,i,limit,adjuster) {
	wrpObj.find('.'+adjuster).css({'height':'auto'});
	var adjusterHeight = wrpObj.find('.'+adjuster).height();
	wrpObj_arr.push(wrpObj);
	adjusterHeight_arr.push(adjusterHeight);
	count ++ ;
	//trace("setListHeight "+i+"  limit "+limit+ "  adjusterHeight "+adjusterHeight);
	
	if(count == limit){
		var txt_MAX = Math.max.apply(null,adjusterHeight_arr);	
		var listN = wrpObj_arr.length;
		for(var v=0;v<listN;v++){
			var obj = wrpObj_arr[v];
			obj.find('.'+adjuster).height(txt_MAX);	
		}//	for
		wrpObj_arr = [];
		adjusterHeight_arr = [];
		count = 0;
	}//	if
}

/*--------------------------------------------------------------

	SMOOTH SCROLL

--------------------------------------------------------------*/
function scrollToAnchorPosition(){
	$('a[href*="#"]').click(function() {
		if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') &&　location.hostname == this.hostname) {
			var target = $(this.hash);
			target = target.length && target;
 
			if (target.length) {       
				var sclpos = $(".thema_header").outerHeight();

				if(isMobile) sclpos = 100;

				var scldurat = 500;
				var offH = 0;
				var targetOffset = target.offset().top - sclpos-offH;
  
				$('html,body').animate({scrollTop: targetOffset}, {duration: scldurat, easing: "easeOutExpo"});
					
				return false;
			}
		}
	});
}	

/*--------------------------------------------------------------
	hashchange 2016/10/11 ver.site
	SPメニュー、モーダルの戻るボタン対応 
	要 jQuery hashchange event - v1.3 
--------------------------------------------------------------*/
var anchorHash;
var modalOpenScPos = 0;

$(window).hashchange( function(){
	hashcheck();
});

function hashcheck(){
	trace("=======================hashcheck!! ");
    var hash = decodeURI(location.hash).split("#")[1];
	trace("location.hash "+hash);
	
	if(!hash){
		if(isModal) hideModal();
		if(modalOpenScPos != 0) $('html,body').animate({ scrollTop: modalOpenScPos }, 0);
	}else if(hash == 'menu'){	//SPメニュー
		showMenu();
	}else{	//modal
	
		anchorHash = "#"+hash;
		if($(anchorHash)[0]){
			//	アンカーが存在するはモーダルではない
			//hideMenu(true);	// メニュー閉じる
			waitTimer(200,"gotoHashAnchorPos");
		}else{
			if(isMenu) hideMenu(true);	// ??
			var modalHash = '.modal_'+hash.split("_")[0];
			//trace("モーダル "+modalHash);
			if($(modalHash)[0]){
				modalHashcheck();
			}
		}
	}
}
function gotoHashAnchorPos(){
	trace("gotoHasuPos "+anchorHash);
	var offsetPos = (isPC) ? 60 : 39;
	var pos = $(anchorHash).offset().top - offsetPos;
	$('html,body').animate({ scrollTop: pos }, 200);
}

/*--------------------------------------------------------------
	modal 2016/8/8
	if($('.modal')[0]){
		initModal();
	}
	
	// callback
	showModal
	showModalComplete
	hideModal
	hideModalComplete
	
	// callback test
	addCallBackEvent('modaltest1','showModal');	
	addCallBackEvent('modaltest2','showModalComplete');	
	addCallBackEvent('modaltest3','hideModalComplete');	

	function modaltest1(){
	trace("showModal OK");
	}
	function modaltest2(){
		trace("showModalComplete OK");
	}
	function modaltest3(){
		trace("hideModal OK");
	}

--------------------------------------------------------------*/
var isModal = false;
var modallist;
var modal,modal_bg,modalW,modalH;
var modalDetailID = 0;
var modalname;
var modalHasData = false;
var isModalLocalChange = false;
var modalDebug = true;

function initModal(){
	if(modalDebug) trace("---------------------------- initModal");
	callBackDispatch('initModal');
	modal = $('.modal');
	modal_bg = $('.modal_bg');
	modalW = modal.width();
	modalH = modal.height();
	modallist = [];
	modal_bg.css({'opacity':0})
	
	//addChangeDeviceEvent("hideModal");
	addResizeEvent("setModalPosition");
	addScrollEvent("setModalPosition");
	setModalPosition();
	
	//	モーダルイベント
	addModalClickEvent();
	//	event dispatch
	callBackDispatch('initModalComplete');
}

function modalHashcheck(){
	if(modalDebug) trace('modalHashcheck　=========================　isModal '+isModal+"  "+location.hash);
	callBackDispatch('modalHashcheck');
	var hash = decodeURI(location.hash).split("#")[1];
	modalname = 'modal_'+hash.split("_")[0];
	modalDetailID = hash.split("_")[1];
	if(!modalDetailID) modalDetailID  = 0;
	
	//	historybackで戻った時前のモダールがあれば閉じる
	if(jQuery.inArray(modalname, modallist) != -1 && !isModalLocalChange){
		if(modalDebug) trace("historyback "+modallist+ "  "+modalname);
		hideModal();
		return;
	};
	modallist.push(modalname);
	
	if(modalDebug){
		trace("modalHashcheck location.hash "+location.hash);
		trace("modalHashcheck hash::"+hash);
		trace("modalname:: "+modalname);
	}
	
	if($('.'+modalname)[0]){
		changeModalDetail();
		showModal();
	}

}
function setModalName(){
	if(modalDebug) trace("---------------------------- setModalName");
	callBackDispatch('setModalName');
	var hash = decodeURI(location.hash).split("#")[1];
	modalname = 'modal_'+hash.split("_")[0];
	modalDetailID = hash.split("_")[1];
	if(!modalDetailID) modalDetailID  = 0;
	
	if(modalDebug){
		trace("modalHashcheck location.hash "+location.hash);
		trace("modalHashcheck hash::"+hash);
		trace("modalname:: "+modalname);
	}
	
	if($('.'+modalname)[0]){
		changeModalDetail();
		trace("setModalName showModal() ");
		showModal();
	}
}
var clickModalname;
function addModalClickEvent(){
	if(modalDebug) trace("---------------------------- addModalClickEvent");
	//	モーダルイベント
	callBackDispatch('addModalClickEvent');
	$('.btn_modal a').on('click',function(event){
		var href = $(this).attr('href');
		clickModalname = href.split("#")[1];
		if(!modalDetailID) modalDetailID  = 1;
		
		if(modalDebug){
			trace("btn_modal:CLICK====================== ");
			trace("href: "+href);
			trace("modalname: "+modalname);
			trace("modalDetailID: "+modalDetailID);
			trace("isModal: "+isModal);
		}
		
		if(isModal){
			changeModal();
		}else{
			modalname = clickModalname;
			changeModalDetail();
		}
		return false;
	});
	
	$('.modal .close, .modal_bg, .closebtn').click(function(event){
		hideModal();
		return false;
	});
	
	$('.modal .prev').click(function(event){
		modalDetailID--;
		changeModalDetail();
		return false;
	});
	$('.modal .next').click(function(event){
		modalDetailID++;
		changeModalDetail();
		return false;
	});
}
//	モーダルの切り替え
function changeModal(){
	if(modalDebug) trace("---------------------------- changeModal");
	callBackDispatch('changeModal');
	
	modal.css({
		'opacity':1,
		'display':'block'
	}).animate({
		'opacity':0
		},{
		'duration': 200,
		'easing': 'linear',
		complete: function(){
			modal.hide();
			$('.modal .modal_content').hide();
			modalname = clickModalname;
			changeModalDetail();
			if(modalDebug) trace("changeModal showModal() ");
			showModal();
		}
	});
}
//	モーダル詳細切り替え
function changeModalDetail(){
	if(modalDebug) trace("----------------------------changeModalDetail:: "+modalname)
	callBackDispatch('changeModalDetail');
	
	isModalLocalChange = true;
	modal = $('.'+modalname);
	
	var maxID = modal.find('.modal_content').length;
	var nowID = getRangeOfnowID(1,maxID,modalDetailID);
	modalDetailID = nowID;
	
	modal.find('.modal_content').hide();
	modal.find('.modal_content:eq('+(modalDetailID-1)+')').show();

	$('.modal_contents_wrp').animate({scrollTop: 0}, {duration: 100, easing: "easeOutExpo"});
	
	//URLに#をつける
	var modalhashname =  modalname.split("_")[1];
	location.hash = modalhashname+"_"+modalDetailID;
	
	callBackDispatch('changeModalDetailComplete');
}
function showModal(){
	if(modalDebug) trace("showModal==============================================");
	
	modal.css({
		'opacity':0,
		'display':'block'
	});
	callBackDispatch('showModal');
	
	//	sidenav 
	if ($('#sidenav')[0] && isSideNav){
		isHideSideNavByUser = true;
		isShowSideNavByUser = false;
		hideSideNav();
	}
	
	modalW = modal.width();
	modalH = modal.height();
	var pagerTop;
	var pagerAreasize;
	var overflowType = (isMobile) ? 'hidden' : 'auto';
	
	$('body').css({'overflow':overflowType,'height':'100%','width':'100%'});
	
	if(stageH < modalH){
		$('.modal_contents_wrp').css({
			'height':stageH,
			'overflow-x':'hidden',
			'overflow-y':'auto'
			}).animate({scrollTop: 0}, {duration: 100, easing: "easeOutExpo"});
		pagerAreasize = stageH;
	}else{
		pagerAreasize = modalH;
	}
	
	if(modal.find('.modal_content').length == 1){
		$('.modal .modal_pager').hide();
	}else{
		$('.modal .modal_pager').show();
	}
	
	modalOpenScPos = scTopPos;
	setModalPosition();
	isModal = true;
	isModalLocalChange = false;
	if(modalHasData){
		modal.find('.hasdata').show();
		modal.find('.nodata').hide();
	}else{
		modal.find('.hasdata').hide();
		modal.find('.nodata').show();
	}
	
	modal.css({
		'opacity':0,
		'display':'block'
	}).animate({
		'opacity':1
		},{
		'duration': 200,
		'easing': 'linear',
		complete: function(){
			setModalPosition();
			callBackDispatch('showModalComplete');
			}
	});
	
	modal_bg.css({'display':'block'}).animate({
		'opacity':0.9
		},{
		'duration': 200,
		'easing': 'linear',
		complete: function(){}
	});
}
function hideModal(){
	if(modalDebug) trace("hideModal==============================================");
	modalHasData = false;
	callBackDispatch('hideModal');
	
	if(isModal){
		$('.modal_contents_wrp').css({'height':'auto','overflow-x':'visible','overflow-y':'visible'});
		$('body').css({'overflow':'visible','height':'auto','width':'100%','position':'relative'});

		$('.modal .modal_content').hide();
		modal.hide();
		modal_bg.hide();
		isModal = false;
		modallist = [];
		// hashを削除
		if(modalDebug) trace("location.hashを削除");
		location.hash = "";
		modalDetailID = 0;
		callBackDispatch('hideModalComplete');
	}
}

function setModalPosition(){
	if(modalDebug) trace("---------------------------- setModalPosition");
	//if(isSP) return;
	callBackDispatch('setModalPosition');
	
	modalW = modal.width();
	modalH = modal.height();
	var left = Math.floor((stageW - modalW) / 2);  
	var top  = Math.floor((stageH - modalH) / 2);
	if(isSP) left = 0;
	
	//var arwH = $('.modal .modal_pager li a').height();
	//pagerTop = (modalH-arwH)/2;
	//$('.modal .modal_pager li a').css({'top':pagerTop})
	
	modal_bg.css({'width':stageW,'height':stageH,'top':0,'left':0,'position':'fixed'});
	modal.css({'top':top,'left':left,'position':'fixed'});
}

/*--------------------------------------------------------------

	moveHashLink

--------------------------------------------------------------*/
function moveHashLink(){

	var target_hash = location.hash;
	var target = $(target_hash);

	if (target.length) {
		var sclpos = 0;
		var scldurat = 1000;
		var offH = (isPC) ? 60 : 0;
		var targetOffset = target.offset().top - sclpos-offH;
		if(isMobile) targetOffset -= 40;
		if(targetOffset < 0) targetOffset = 0;
		$('html,body').animate({scrollTop: targetOffset}, {duration: scldurat, easing: "easeOutExpo"});

		return false;
	}

}



/*--------------------------------------------------------------

	J:Magazine!

--------------------------------------------------------------*/
function loadLaneJMagazine(){
	trace("J:Magazine! loadLaneJMagazine -------------------");
	var json_url = '/tv/assets/js/jmagazine_json.php';
	//json_url = '/tv/assets/js/jmagazine_test.json';

    // PHPファイルからJSONデータを取得する
    $.ajax({
		url: json_url,
        type: 'GET',
        dataType: 'json',
        success: function(data) {
			jmagazineDataLoaded(data);
        },
        error: function(xhr, status, error) {
            // エラーハンドリング
          	trace('JSONデータの読み込みに失敗しました:', error);
			trace(error);
			$('.section-jmagagine').hide();
        }
    });
}

function jmagazineDataLoaded(data){
	trace("jmagazineDataLoaded ----------------------　")
	
	var json_data = filterJMagazineDataByGenre(JSON.parse(data),"韓国・アジアドラマ");
	trace(json_data);

	var count = 0;
	var html = '';
	var slider = $('.lane_wrp_jmaga .slick_slider');
	var parent = $('.lane_wrp_jmaga');

	var programList = [];
	var option;
	var class_name;


	$.each(json_data, function(index, item) {
		var rank = item.rank;
		if(rank == "高" || rank == "中"){
			var date_str = formatJmagagineDates(item.startdate,item.enddate);
			var new_icon = "";
			if (isWithinXDays(item.startdate, 7)) {
				new_icon = "<span class='icon_new'>NEW</span>";
			}
			var type = '<p class="c-card_text">'+date_str+new_icon+'</p>';
			
			trace(item.genre);

			var obj = {
				type:type,
				linkUrl:item.url,
				imageUrl:item.images,
				title:item.title,
				label:item.genre,
				linkUrl:item.url,
				copyright:item.copyright,
				blank:"blank"
			}
			if(count < 10){
				programList.push(obj);
				// html += htmlTagGenerater(obj);
				// addCopyrightSection(obj.copyright);
			}
			count++;
		}
	});

	//	番組の数によって設定を調整
	var sliderObj = getSliderDataAndStatus(programList);
	var data = sliderObj.data;
	var option = sliderObj.option;
	var class_name = sliderObj.class_name;
	parent.addClass(class_name);
	//	スライダーの管理に登録
	sliderObj.slider = slider;
	addSliderObjList(sliderObj);

	//	HTMLを作成
	var loop = data.length;
	for(var i=0;i<loop;i++){

		//	API種別によってフォーマットを調整
		var myData = data[i];// getMyDataStaticJSDATA(data[i]);
		myData.date = myData.deliveryDate;
		
		//	データからHTMLを生成、コピーライトの追加
		html += createLaneSliderHTML(myData);
		addCopyrightSection(myData.copyright);
	}//	for	

	//	準備完了
	slider.addClass("loaded");
	slider.html(html);

	//	スライダー起動
	slider.slick(option);
}

function isWithinXDays(startdate, days) {
    // 現在の日付を取得
    var currentDate = new Date();
	currentDate.setHours(0, 0, 0, 0);
    
    // 開始日をDateオブジェクトに変換
    var start = new Date(startdate);
    
    // X日後の日付を計算
	var futureDate = new Date(currentDate);
    futureDate.setDate(currentDate.getDate() - days);

    // 開始日が本日からX日以内かどうかを判定
    return start >= futureDate;
}

function formatJmagagineDates(dateString) {
	const daysOfWeek = ["日", "月", "火", "水", "木", "金", "土"];
    const date = new Date(dateString);
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JavaScriptの月は0から始まるので+1
    const day = date.getDate();
    const dayOfWeek = daysOfWeek[date.getDay()];

    return `${year}年${month}月${day}日(${dayOfWeek})`;
}

function filterJMagazineDataByGenre(arr, genre) {
    return arr.filter(item => item.genre.split(',').includes(genre));
}

