/**
 * Created by chriscai on 2015/1/12.
 */
var http = require('http');

var  log4js = require('log4js'),
     Apply = require('../model/Apply'),
     http = require('http'),
     _ = require('underscore'),
     logger = log4js.getLogger();



var StatisticsService = function (){

    this.statisticsDao = global.models.statisticsDao;
    this.applyDao = global.models.applyDao;

    if(GLOBAL.DEBUG){
        this.url = 'http://183.60.70.234:9000/errorMsgTop';
    }else {
        this.url = 'http://10.143.132.205:9000/errorMsgTop';
    }

    logger.debug('query url : ' + this.url);
};



StatisticsService.prototype = {
    query : function (query , callback){


    },
    fetchAndSave : function (id , startDate){
        var self = this;
        http.get((this.url + '?id=' + id + '&startDate=' + (startDate -0 ))  , function(res){
            var buffer = '';
            res.on('data' , function (chunk){
                buffer += chunk.toString();
            }).on('end' , function (){
                var saveModel = {};
                try {
                    var result = JSON.parse(buffer);

                    saveModel = {
                        startDate : new Date(result.startDate),
                        endDate : new Date(result.endDate),
                        content : JSON.stringify(result.result),
                        total : 0
                    };

                    _.each(result.result , function (value ,key ){
                        for(var key : result.result){
                            saveModel.total += result.result[key];
                        }
                    })

                }catch(e){
                    logger.error('error :' + err);
                    saveModel = {
                        startDate: startDate,
                        endDate: startDate + 86400000,
                        content: "{}",
                        total: 0
                    }
                }

                self.statisticsDao.create(saveModel , function (err , items){
                    if(err){
                        logger.error("Insert into b_statistics error(id=", id + ") :  " +  err);
                    }
                    logger.info("Insert into b_statistics success(id=", id + ") :  " + buffer.toString());
                });
            })

        }).on('error' , function (err){
            logger.error('error :' + err);
        });
    },

    startMonitor : function (){
        var self = this;


        var getTomrrowDay = function (){
            return new Date(nowDate.getFullYear() + "-" + (nowDate.getMonth() + 1)  + "-" + (nowDate.getDay()+1) + "01:00:00");
        }

        var getStartDay = function (){
            return new Date(nowDate.getFullYear() + "-" + (nowDate.getMonth() + 1) +  "-" + (nowDate.getDay()) + "00:00:00");
        }

        var nowDate = new Date ;
        var targetDate = getTomrrowDay();

        var startTimeout = function (){
            setTimeout(function (){
                var startDate = getStartDay();
                self.applyDao.find({status: Apply.STATUS_PASS} , function (err , item){
                    if(err){
                        logger.error("find apply erro  :  " +  err);
                    }
                    _.each(item , function (value ,key ){
                        self.fetchStatistics(value.id , startDate );
                    })

                    nowDate = new Date();
                    startDate = getStartDay();
                    targetDate =  getTomrrowDay();

                    startTimeout();
                })



            } , targetDate - nowDate)
        }

        startTimeout();


    }
};


module.exports =  StatisticsService;
