var songDetail = angular.module('songDetail',['ngRoute']);

var songApp = angular.module('songApp',
        ["ngRoute","songDetail"]
);

songApp.component('songList',{
    templateUrl:'templates/song-list.template.html',
    controller: ['$scope','$http',function songController($scope,$http){
        this.song = '';
        this.url='';
        this.albums = [
            'David Bowie',
            'Space Oddity',
            'The Man Who Sold the World',
            'Hunky Dory',
            'Ziggy Stardust',
            'Aladdin Sane',
            'Pin Ups',
            'Diamond Dogs',
            'Young Americans',
            'Station to Station',
            'Low',
            'Heroes',
            'Lodger',
            'Scary Monsters',
            "Let's Dance"
        ];
        this.query='';
        this.searchParam='album';
        self=this;
    
        this.trustURL=function(url){
            return $sce.trustAsResourceUrl(url);
        };
         
        this.setSong= function(song){
            self.curr_song = song;
            var songID = song.id;
            self.url = "https://www.youtube.com/embed/"+songID+"?autoplay=1";
        }

        this.setQuery = function(key,value){
            if(value.length>1){
                //Only update the list of videos if we have a sufficiently long search term
                var newSearchObj = {};
                newSearchObj[key] = value;
                self.searchObj=newSearchObj;

            }else if(value == '-1'){
                //Use a special key for all
                var newSearchObj = {};
                newSearchObj[key] = '';
                self.searchObj=newSearchObj;
            }
            return self.searchObj;
        }
        $http.get('jsons/songs.json').then((response)=>{
            this.songs = response.data;
            var firstSong = _.sample(this.songs);
            this.curr_song = firstSong;
            this.url = "https://www.youtube.com/embed/"+firstSong.id;
            this.query = firstSong.album
            this.searchObj={'album':this.query};
        });
        //start loading all the songs' lyrics after the display is "good"
    }],
});

songDetail.component('songDetail',{
    templateUrl:'templates/song-detail.template.html',
    controller:['$http','$routeParams','$sce',function($http,$routeParams,$sce){
        var self=this;
        this.name = $routeParams.song;
        this.setParams=function(){
                //find the song object matching the song's name
                var loc = _.findIndex(self.songs,song=>
                        (song.song_name==self.name)
                );
                self.song = this.songs[loc];
                self.url = "https://www.youtube.com/embed/"+this.song.id+"?autoplay=1";
        };
        if(allSongs == undefined){
            $http.get('jsons/songs.json').then((response)=>{
                this.songs = response.data;
                allSongs = this.songs;
                this.setParams();
            });
        } else {
            this.songs = allSongs;
            this.setParams();
        }
        this.trustURL=function(url){
            return $sce.trustAsResourceUrl(url);
        };
    }]
});

songApp.config(['$locationProvider','$routeProvider','$sceProvider',
        function($locationProvider,$routeProvider,$sceProvider){
            $sceProvider.enabled(false);
            $locationProvider.hashPrefix('!'); 
            $routeProvider.
                when('/songs',{
                    template: '<song-list></song-list>'
                }).
                when('/songs/:song',{
                    template: '<song-detail></song-detail>'
                }).
                otherwise('/songs');
        }
]);
