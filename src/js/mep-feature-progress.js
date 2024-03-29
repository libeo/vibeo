(function($) {

	$.extend(mejs.MepDefaults, {
		rewindText: 'Rewind',
		forwardText: 'Forward',
		hour: 'hours',
		minutes: 'minutes',
		seconds: 'seconds',
		seekDistance: 0.1
	});

	// progress/loaded bar
	$.extend(MediaElementPlayer.prototype, {
		buildprogress: function(player, controls, layers, media) {

			$('<div class="mejs-time-rail">'+
				'<span class="mejs-time-total">'+
					'<span class="mejs-time-buffering"></span>'+
					'<span class="mejs-time-loaded"></span>'+
					'<span class="mejs-time-current"></span>'+
					'<span class="mejs-time-temp visuallyhidden" aria-live="polite" aria-hidden="false"></span>' +
					'<span class="mejs-button mejs-time-handle">' +
						'<button class="mejs-time-handle-rewind visuallyhidden" aria-live="polite"><span class="visuallyhidden" aria-live="polite" aria-hidden="false">'+this.options.rewindText+'</span></button>' +
						'<button class="mejs-time-handle-forward visuallyhidden" aria-live="polite"><span class="visuallyhidden" aria-live="polite" aria-hidden="false">'+this.options.forwardText+'</span></button>' +
					'</span>'+
					'<span class="mejs-time-float">' +
						'<span class="mejs-time-float-current">00:00</span>' +
						'<span class="mejs-time-float-corner"></span>' +
					'</span>'+
				'</span>'+
			'</div>')
				.appendTo(controls);
				controls.find('.mejs-time-buffering').hide();

			var
				t = this,
				total = controls.find('.mejs-time-total'),
				loaded  = controls.find('.mejs-time-loaded'),
				current  = controls.find('.mejs-time-current'),
				handle  = controls.find('.mejs-time-handle'),
				handleRewind = handle.find('.mejs-time-handle-rewind'),
				handleForward = handle.find('.mejs-time-handle-forward'),
				timefloat  = controls.find('.mejs-time-float'),
				timefloatcurrent  = controls.find('.mejs-time-float-current'),
				handleMouseMove = function (e) {
					// mouse position relative to the object
					var x = e.pageX,
						offset = total.offset(),
						width = total.outerWidth(true),
						percentage = 0,
						newTime = 0,
						pos = 0;


					if (media.duration) {
						if (x < offset.left) {
							x = offset.left;
						} else if (x > width + offset.left) {
							x = width + offset.left;
						}
						
						pos = x - offset.left;
						percentage = (pos / width);
						newTime = (percentage <= 0.02) ? 0 : percentage * media.duration;

						// seek to where the mouse is
						if (mouseIsDown && newTime !== media.currentTime) {
							media.setCurrentTime(newTime);
						}

						// position floating time box
						if (!mejs.MediaFeatures.hasTouch) {
								timefloat.css('left', pos);
								timefloatcurrent.html( mejs.Utility.secondsToTimeCode(newTime) );
								timefloat.show();
						}
					}
				},
				mouseIsDown = false,
				mouseIsOver = false;

			// handle clicks
			//controls.find('.mejs-time-rail').delegate('span', 'click', handleMouseMove);
			total
				.bind('mousedown', function (e) {
					// only handle left clicks
					if (e.which === 1) {
						mouseIsDown = true;
						handleMouseMove(e);
						t.globalBind('mousemove.dur', function(e) {
							handleMouseMove(e);
						});
						t.globalBind('mouseup.dur', function (e) {
							mouseIsDown = false;
							timefloat.hide();
							t.globalUnbind('.dur');
						});
						return false;
					}
				})
				.bind('mouseenter', function(e) {
					mouseIsOver = true;
					t.globalBind('mousemove.dur', function(e) {
						handleMouseMove(e);
					});
					if (!mejs.MediaFeatures.hasTouch) {
						timefloat.show();
					}
				})
				.bind('mouseleave',function(e) {
					mouseIsOver = false;
					if (!mouseIsDown) {
						t.globalUnbind('.dur');
						timefloat.hide();
					}
				});
			//handlebar main focus
			handle.focusin(function(e) {
				handleRewind.removeClass('visuallyhidden');
				handleForward.removeClass('visuallyhidden');
			});
			handle.focusout(function(e) {
				handleRewind.addClass('visuallyhidden');
				handleForward.addClass('visuallyhidden');
				handleRewind.children('span').text(t.options.rewindText);
				handleForward.children('span').text(t.options.forwardText);
			});

			//fire events when the button is pressed
			handleRewind.click(function(e){
				if (!isNaN(media.duration) && media.duration > 0) {
					// 5%
					var newTime = Math.max(media.currentTime - (media.duration * t.options.seekDistance), 0);
					media.setCurrentTime(newTime);
					handleRewind.children('span').text(mejs.Utility.formatTimeForScreenReaders(mejs.Utility.secondsToTimeCode(t.media.currentTime), t.options.hours, t.options.minutes, t.options.seconds)+
						' de '+mejs.Utility.formatTimeForScreenReaders(mejs.Utility.secondsToTimeCode(t.media.duration), t.options.hours, t.options.minutes, t.options.seconds));
				}
			});
			handleForward.click(function(e){
				if (!isNaN(media.duration) && media.duration > 0) {
					// 5%
					var newTime = Math.min(media.currentTime + (media.duration * t.options.seekDistance), media.duration);
					media.setCurrentTime(newTime);
					handleForward.children('span').text(mejs.Utility.formatTimeForScreenReaders(mejs.Utility.secondsToTimeCode(t.media.currentTime), t.options.hours, t.options.minutes, t.options.seconds)+
						' de '+mejs.Utility.formatTimeForScreenReaders(mejs.Utility.secondsToTimeCode(t.media.duration), t.options.hours, t.options.minutes, t.options.seconds));
				}
			});

			$(document)
				.bind('mouseup', function (e) {
					mouseIsDown = false;
					timefloat.hide();
					//handleMouseMove(e);
				})
				.bind('mousemove', function (e) {
					if (mouseIsDown || mouseIsOver) {
						handleMouseMove(e);
					}
				});

			// loading
			media.addEventListener('progress', function (e) {
				player.setProgressRail(e);
				player.setCurrentRail(e);
			}, false);

			// current time
			media.addEventListener('timeupdate', function(e) {
				player.setProgressRail(e);
				player.setCurrentRail(e);
			}, false);


			// store for later use
			t.loaded = loaded;
			t.total = total;
			t.current = current;
			t.handle = handle;
		},
		setProgressRail: function(e) {

			var
				t = this,
				target = (e != undefined) ? e.target : t.media,
				percent = null;

			// newest HTML5 spec has buffered array (FF4, Webkit)
			if (target && target.buffered && target.buffered.length > 0 && target.buffered.end && target.duration) {
				// TODO: account for a real array with multiple values (only Firefox 4 has this so far)
				percent = target.buffered.end(0) / target.duration;
			}
			// Some browsers (e.g., FF3.6 and Safari 5) cannot calculate target.bufferered.end()
			// to be anything other than 0. If the byte count is available we use this instead.
			// Browsers that support the else if do not seem to have the bufferedBytes value and
			// should skip to there. Tested in Safari 5, Webkit head, FF3.6, Chrome 6, IE 7/8.
			else if (target && target.bytesTotal != undefined && target.bytesTotal > 0 && target.bufferedBytes != undefined) {
				percent = target.bufferedBytes / target.bytesTotal;
			}
			// Firefox 3 with an Ogg file seems to go this way
			else if (e && e.lengthComputable && e.total != 0) {
				percent = e.loaded/e.total;
			}

			// finally update the progress bar
			if (percent !== null) {
				percent = Math.min(1, Math.max(0, percent));
				// update loaded bar
				if (t.loaded && t.total) {
					//console.log();
					/*if($(".ie7").length || $(".ie6").length){

					}*/
					t.loaded.width(t.total.width() * percent);
					//console.log(percent*100);
				}
			}
		},
		setCurrentRail: function() {

			var t = this;

			if (t.media.currentTime != undefined && t.media.duration) {

				// update bar and handle
				if (t.total && t.handle) {
					var 
						newWidth = Math.round((t.total.width() - t.handle.outerWidth(true)) * t.media.currentTime / t.media.duration),
						handlePos = newWidth;

					t.current.width(newWidth);
					t.handle.css('left', handlePos);
				}
			}

		}
	});
})(mejs.$);
