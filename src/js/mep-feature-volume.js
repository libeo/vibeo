(function($) {

	$.extend(mejs.MepDefaults, {
		muteTextMute: 'Mute',
		muteTextUnmute: 'Unmute',
		volumeUpText: 'Volume Up',
		volumeDownText: 'Volume Down',
		hideVolumeOnTouchDevices: true,

		audioVolume: 'horizontal',
		videoVolume: 'vertical'
	});

	$.extend(MediaElementPlayer.prototype, {
		buildvolume: function(player, controls, layers, media) {
			
			// Android and iOS don't support volume controls
			if (mejs.MediaFeatures.hasTouch && this.options.hideVolumeOnTouchDevices)
				return;

			var t = this,
				mode = (t.isVideo) ? t.options.videoVolume : t.options.audioVolume,
				mute = (mode == 'horizontal') ?

				// horizontal version
				$('<div class="mejs-button mejs-volume-button mejs-mute">'+
					'<button type="button" aria-controls="' + t.id + '" aria-live="polite"><span class="visuallyhidden">'+t.options.muteTextMute+'</span></button>'+
					'<div class="mejs-volume-slider horizontal">'+ // outer background
						'<button class="mejs-volume-minus" aria-live="polite"><span class="visuallyhidden">'+t.options.volumeDownText+'</span></button>'+ // volume down
						'<div class="mejs-volume-total"></div>'+ // line background
						'<div class="mejs-volume-current"></div>'+ // current volume
						'<div class="mejs-volume-handle"></div>'+ // handle
						'<button class="mejs-volume-plus" aria-live="polite"><span class="visuallyhidden">'+t.options.volumeUpText+'</span></button>'+ // volume up
					'</div>' +
				'</div>'
				)
					.appendTo(controls) :

				// vertical version
				$('<div class="mejs-button mejs-volume-button mejs-mute">'+
					'<button type="button" aria-controls="' + t.id + '" aria-live="polite"><span class="visuallyhidden">'+t.options.muteTextMute+'</span></button>'+
					'<div class="mejs-volume-slider">'+ // outer background
						'<button class="mejs-volume-minus" aria-live="polite"><span class="visuallyhidden">'+t.options.volumeDownText+'</span></button>'+ // volume down
						'<div class="mejs-volume-total"></div>'+ // line background
						'<div class="mejs-volume-current"></div>'+ // current volume
						'<div class="mejs-volume-handle"></div>'+ // handle
						'<button class="mejs-volume-plus"><span class="visuallyhidden">'+t.options.volumeUpText+'</span></button>'+ // volume up
					'</div>'+
				'</div>')
					.appendTo(controls),
			volumeSlider = t.container.find('.mejs-volume-slider'),
			volumeTotal = t.container.find('.mejs-volume-total'),
			volumeCurrent = t.container.find('.mejs-volume-current'),
			volumeHandle = t.container.find('.mejs-volume-handle'),
			volumePlus = t.container.find('.mejs-volume-plus'),
			volumeMinus = t.container.find('.mejs-volume-minus'),

			positionVolumeHandle = function(volume) {

				var volumeSliderIsVisible = volumeSlider.is(':visible');
				if (!volumeSliderIsVisible) {
					volumeSlider.show();
				}

				// correct to 0-1
				volume = Math.max(0,volume);
				volume = Math.min(volume,1);

				// ajust mute button style
				if (volume == 0) {
					mute.removeClass('mejs-mute').addClass('mejs-unmute');
				} else {
					mute.removeClass('mejs-unmute').addClass('mejs-mute');
				}

				// position slider
				if (mode == 'vertical') {
					var

						// height of the full size volume slider background
						totalHeight = volumeTotal.height(),

						// top/left of full size volume slider background
						totalPosition = volumeTotal.position(),

						// the new top position based on the current volume
						// 70% volume on 100px height == top:30px
						newTop = totalHeight - (totalHeight * volume);

					// handle
					volumeHandle.css('top', totalPosition.top + newTop - (volumeHandle.height() / 2));

					// show the current visibility
					volumeCurrent.height(totalHeight - newTop );
					volumeCurrent.css('top', totalPosition.top + newTop);
				} else {
					var

						// height of the full size volume slider background
						totalWidth = volumeTotal.width(),

						// top/left of full size volume slider background
						totalPosition = volumeTotal.position(),

						// the new left position based on the current volume
						newLeft = totalWidth * volume;

					// handle
					volumeHandle.css('left', totalPosition.left + newLeft - (volumeHandle.width() / 2));

					// rezize the current part of the volume bar
					volumeCurrent.width( newLeft );
				}
				if (!volumeSliderIsVisible) {
					volumeSlider.hide();
				}
			},
			handleVolumeMove = function(e) {
				var volume = null,
					totalOffset = volumeTotal.offset();

				// calculate the new volume based on the mouse position
				if (mode == 'vertical') {

					var
						railHeight = volumeTotal.height(),
						totalTop = parseInt(volumeTotal.css('top').replace(/px/,''),10),
						newY = e.pageY - totalOffset.top;

					volume = (railHeight - newY) / railHeight;

					// the controls just hide themselves (usually when mouse moves too far up)
					if (totalOffset.top == 0 || totalOffset.left == 0)
						return;

				} else {
					var
						railWidth = volumeTotal.width(),
						newX = e.pageX - totalOffset.left;

					volume = newX / railWidth;
				}

				// ensure the volume isn't outside 0-1
				volume = Math.max(0,volume);
				volume = Math.min(volume,1);

				// position the slider and handle
				positionVolumeHandle(volume);

				// set the media object (this will trigger the volumechanged event)
				if (volume == 0) {
					media.setMuted(true);
				} else {
					media.setMuted(false);
				}
				media.setVolume(volume);
			},
			mouseIsDown = false,
			mouseIsOver = false;

			// SLIDER

			mute
				.bind('mouseenter', function(e) {
					volumeSlider.show();
					positionVolumeHandle(media.volume);
					mouseIsOver = true;
				})
				.bind('mouseleave', function(e) {
					mouseIsOver = false;

					if (!mouseIsDown)	{
						volumeSlider.hide();
					}
				})
				.children('button')
				.bind('focus', function(e) {
					volumeSlider.show();
					mouseIsOver = true;
				});
			//keyboard support for volume control
			volumePlus
				.click(function(e){
					var newVolume = Math.min(media.volume + 0.1, 1);
					media.setVolume(newVolume);
				});
			volumeMinus
				.click(function(e){
					var newVolume = Math.max(media.volume - 0.1, 0);
					media.setVolume(newVolume);
				});

			$(document).on('focus', 'button,a', {volumeSlider: volumeSlider}, function(e){
				if($(this).closest(mute).length == 0){
					e.data.volumeSlider.hide();
				}
			});
			//this is used to counter aria live problem reading the parent button each time button is pressed
			volumeSlider
				.bind('mouseover', function() {
					mouseIsOver = true;
				})
				.bind('mousedown', function (e) {
					// If event is initialize by mouse event and not keydown event (there was a bug with Chrome + NVDA)
					console.log(e.offsetX);
					if(e.offsetX != 0){
						handleVolumeMove(e);
						$(document)
							.bind('mousemove.vol', function(e) {
								handleVolumeMove(e);
							})
							.bind('mouseup.vol', function () {
								mouseIsDown = false;
								$(document).unbind('.vol');
	
								if (!mouseIsOver && mode == 'vertical') {
									volumeSlider.hide();
								}
							});
						mouseIsDown = true;
	
						return false;
					}
				});

			// MUTE button
			mute.find(':first')
				.click(function() {
					media.setMuted( !media.muted )
				})
				.focus(function(){
					$(this).attr('aria-live', 'polite')
				})
				.blur(function(){
					$(this).attr('aria-live','off')
			});
			// listen for volume change events from other sources
			media.addEventListener('volumechange', function(e) {
				var volumeSpan = mute.children('button').children('span');
				if (!mouseIsDown) {
					if (media.muted) {
						positionVolumeHandle(0);
						mute.removeClass('mejs-mute').addClass('mejs-unmute');
						volumeSpan.text(t.options.muteTextUnmute);
					} else {
						positionVolumeHandle(media.volume);
						mute.removeClass('mejs-unmute').addClass('mejs-mute');
						volumeSpan.text(t.options.muteTextMute);
					}
				}
			}, false);

			if (t.container.is(':visible')) {
				// set initial volume
				positionVolumeHandle(player.options.startVolume);

				// shim gets the startvolume as a parameter, but we have to set it on the native <video> and <audio> elements
				if (media.pluginType === 'native') {
					media.setVolume(player.options.startVolume);
				}
			}
		}
	});

})(mejs.$);
