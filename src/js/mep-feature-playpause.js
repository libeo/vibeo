(function($) {

	$.extend(mejs.MepDefaults, {
		playpauseText: 'Play/Pause',
		playText: 'Play',
		pauseText: 'Pause'
	});

	// PLAY/pause BUTTON
	$.extend(MediaElementPlayer.prototype, {
		buildplaypause: function(player, controls, layers, media) {
			var
				t = this,
				play =
				$('<div class="mejs-button mejs-playpause-button mejs-play" >' +
					'<button id="btnplaypause" type="button" aria-controlsEnabled="' + t.id + '" aria-live="polite"><span class="visuallyhidden">'+t.options.playText+'</span></button>' +
				'</div>')
				.appendTo(controls)
				.click(function(e) {
					e.preventDefault();

					if (media.paused) {
						media.play();
					} else {
						media.pause();
					}

					return false;
				});

			media.addEventListener('play',function() {
				$('#btnplaypause span').text(t.options.pauseText);
				play.removeClass('mejs-play').addClass('mejs-pause');
			}, false);
			media.addEventListener('playing',function() {
				$('#btnplaypause span').text(t.options.pauseText);
				play.removeClass('mejs-play').addClass('mejs-pause');
			}, false);


			media.addEventListener('pause',function() {
				$('#btnplaypause span').text(t.options.playText);
				play.removeClass('mejs-pause').addClass('mejs-play');
			}, false);
			media.addEventListener('paused',function() {
				$('#btnplaypause span').text(t.options.playText);
				play.removeClass('mejs-pause').addClass('mejs-play');
			}, false);
		}
	});

})(mejs.$);
