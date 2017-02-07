var songDetail = angular.module('songDetail',['ngRoute']);

var bowieAlbums = [
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

var songApp = angular.module('songApp',
        ["ngRoute","songDetail"]
);

songApp.component('songList',{
    templateUrl:'templates/song-list.template.html',
    controller: ['$scope','$http','$filter',
        function songController($scope,$http,$filter){
        /* Initialize Parameters
         */
        this.song = '';
        this.url='';
        this.albums = bowieAlbums;
        this.query='';
        this.searchParam='album';
        this.queryResults={};
        var self=this;
    
        /* Enables page to display embedded youtube url
         */
        this.trustURL=function(url){
            return $sce.trustAsResourceUrl(url);
        };
        
        /* Get the lyrics for the current song from its json
         */
        this.fetchLyrics= function(){
            var lyric_json = "lyrics/"+self.curr_song.album+".json";
            $http.get(lyric_json).then((response)=>{
                lyrics = response.data[self.curr_song.song_name];
                //hack to prevent duplicate ids in repeater
                self.lyrics=_.map(lyrics,line=>{
                    var obj = {};
                    obj['line']=line;
                    return obj;
                });
                console.log(self.lyrics);
            });
        }

        /* Updates variables to show detail for a specific song
         */ 
        this.setSong= function(song,autoplay){
            self.curr_song = song;
            var songID = song.id;
            self.url = "https://www.youtube.com/embed/"+songID;
            if(autoplay){
                self.url+="?autoplay=1";
            }
            self.fetchLyrics();
        };
        
        /* Updates the list of displayed values
         */
        this.updateQueryResults = function(){
            console.log(self.order);
            var searchObj = {};
            searchObj[self.searchParam] = self.query;
            self.queryResults=$filter('filter')(self.songs,searchObj,self.order);
        };

        /* Changes the list of displayed values based on a new query
         */
        this.updateByQuery = function(query){
            self.query = query;
            self.updateQueryResults();
        } 

        /* Updates the query result if enter was pressed
         */
        this.updateOnKeyPress = function(keyVal){
            if(keyVal == 13){
                self.updateQueryResults();
            }
        };

        /* "main" function
         * Get the initial state of the page after loading the song list
         */
        $http.get('jsons/songs.json').then((response)=>{
            this.songs = response.data;
            var firstSong = _.sample(this.songs);
            this.setSong(firstSong);
            this.query = firstSong.album;
            this.updateQueryResults();
        });

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
