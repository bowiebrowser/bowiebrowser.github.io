var songDetail = angular.module('songDetail',['ngRoute']);
var allSongs;
var mostRecentQuery="Lodger";

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
        this.query=mostRecentQuery;
        self=this;

        this.trustURL=function(url){
            return $sce.trustAsResourceUrl(url);
        };
         
        this.setSong= function(songID){
            console.log(songID);
            self.url = "https://www.youtube.com/embed/"+songID+"?autoplay=1";
        }

        if(allSongs == undefined){
            $http.get('jsons/songs.json').then((response)=>{
                this.songs = response.data;
                allSongs = this.songs;
            });
        } else {
            this.songs = allSongs;
        }
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
