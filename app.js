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
    "Let's Dance",
    "Tonight",
    "Never Let Me Down",
    "Black Tie White Noise",
    "Outside",
    "Earthling",
    "Hours",
    "Heathen",
    "Reality",
    "The Next Day",
    "Blackstar"
];


var songApp = angular.module('songApp',
        ["ngRoute","songDetail"]
);

songApp.service('YoutubeService',['$window','$rootScope',function($window,$rootScope){
    var youtube = {
        ready: false,
        player: null,
        playerId: null,
        videoId: null,
        videoTitle: null,
        playerHeight: '100%',
        playerWidth: '100%'
    };

    var self=this;
    /* Bind the youtube player to an HTML element
     */
    this.bindPlayer = function (elementId) {
        youtube.playerId = elementId;
    };
    
    /* Create a new youtube player using the Youtube API
     */
    this.createPlayer = function () {
        return new YT.Player(youtube.playerId, {
            height: youtube.playerHeight,
            width: youtube.playerWidth,
            playerVars: {
                  rel: 0,
                  showinfo: 0,
                  autoplay: 0
            },
            events: {
                onStateChange: this.onPlayerStateChange
            }
        });
    };

    /* Hackish way to call function from controller on event
     */
    this.setMaster = function(master){
        self.master = master;
    };

    this.onPlayerStateChange = function(event){
        if(self.master){
            self.master.onPlayerStateChange(event);
        }else if(event.data === 0){
            console.log("Youtube Service has no master :(");
        }
    };

    this.launchPlayer = function (id,autoPlay) {
        youtube.player.loadVideoById(id);
        youtube.videoId = id;
        if(!autoPlay) youtube.player.stopVideo();
    };

    this.loadPlayer = function () {
        if (youtube.ready && youtube.playerId) {
            if (youtube.player) {
                youtube.player.destroy();
            }
            youtube.player = self.createPlayer();
        }
    };
    
    this.isReady = function(){
        return youtube.player !== null;
    };

    $window.onYouTubeIframeAPIReady = function () {
        youtube.ready = true;
        self.bindPlayer('yt_placeholder');
        self.loadPlayer();
        $rootScope.$apply();
    };

}]);

songApp.component('songList',{
    templateUrl:'templates/song-list.template.html',
    controller: ['$scope','$http','$filter','YoutubeService',
    function songController($scope,$http,$filter,YoutubeService){

        /* Initialize Parameters
         */
        this.song = '';
        this.url='';
        this.albums = bowieAlbums;
        this.query='';
        this.searchParam='album';
        this.queryResults={};
        this.autoplay=0;
        //parameters to be passed into the Youtube iframe api
        this.events={'onStateChange':this.getNextVideo};
        var self=this;

        /* "main" function
         * Get the initial state of the page after loading the song list
         */
        var init = function(){
            $http.get('jsons/songs.json').then((response)=>{
                self.songs = response.data;
                var firstSong = _.sample(self.songs);
                self.setSong(firstSong);
                self.query = firstSong.album;
                self.updateQueryResults();
            });
        };
        init();
        
        /* Get the lyrics for the current song from its json
         */
        this.fetchLyrics= function(){
            var lyric_json = "lyrics/"+self.curr_song.album+".json";
            $http.get(lyric_json).then((response)=>{
                var song = response.data[self.curr_song.song_name];
                self.lyrics_src=song.url;
                //hack to prevent duplicate ids in repeater
                self.lyrics=_.map(song.lyrics,line=>{
                    var obj = {};
                    obj['line']=line;
                    return obj;
                });
            });
        };

        /* Play the next video in the search queue in sequence
         */
        this.onPlayerStateChange = function(event){
            if(event.data === 0){
                this.playNextVideo();
            }
        };

        this.playNextVideo = function(){
            //check to see if the current song exists in queryResults
            var currVidLoc = _.indexOf(self.queryResults,self.curr_song);
            //if it is, make the next video in the list the current one
            if(currVidLoc !=-1 && currVidLoc < self.queryResults.length-1){
                self.setSong(self.queryResults[currVidLoc+1],true);
            }
        };
        /* Calls our youtube service to start a new video
         */
        this.updateYoutubePlayer = function(){
            if(YoutubeService.isReady()){
                YoutubeService.setMaster(self);
                YoutubeService.launchPlayer(self.curr_song.id,self.autoplay);
            }else{
                setTimeout(this.updateYoutubePlayer,1500);
            }
        }
        /* Updates variables to show detail for a specific song
         */ 
        this.setSong= function(song,autoplay){
            self.autoplay = autoplay;
            self.curr_song = song;
            self.fetchLyrics();
            self.updateYoutubePlayer();
        };
       

        /* Search song lyric JSONs album by album
         */ 
        this.searchByLyrics = function() { 
            self.queryResults = [];
            //make search case-insensitive
            var query = self.query.toUpperCase();
            //top loop: For each album,
            _.each(self.albums,function(album){
                var lyric_json = "lyrics/"+album+".json";
                //get the lyrics of every song in the album
                $http.get(lyric_json).then((response)=>{
                    //then for every song in the album
                    _.each(response.data,function(song){
                        //and for every line in the song
                        var song_added = false;
                        _.each(song.lyrics,function(line){
                            //print it
                            if(line.toUpperCase().indexOf(query) != -1 && !song_added){
                                //here's the inefficient part: find the song
                                //in our songlist with a matching title
                                var toAdd= _.where(self.songs,{song_name:song.title})[0];
                                self.queryResults.push(toAdd);
                                song_added = true;
                            }
                        });
                    });
                });
            });
        } 

        /* Updates the list of displayed values
         */
        this.updateQueryResults = function(){
            if(self.searchParam == 'lyrics'){
                this.searchByLyrics();
            } else {
                var searchObj = {};
                searchObj[self.searchParam] = self.query;
                self.queryResults=$filter('filter')(self.songs,searchObj,self.order);
            }
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
    }],
});


songApp.run(function () {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
});

/* songDetail is currently depricated
 */
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
