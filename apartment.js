			$('.onoff')
				.attr('onclick','$(this).toggleClass("on")')
				.click(function(){toggleamenity($(this).attr('amenity'))});
			//var mustcat=mustdog=mustlaundry+mustgarage=false;	
			//cats=(cats==true) ? 'yes':'*';
			//cats=(dogs==true) ? 'yes':'*';
			//laundry=(laundry==true) ? 'yes':'*';
			var laundry='AND w_d_in_unit:yes';
			
			function toggleamenity(type)
				{type=!type};
			
			
			window.latitude=38.9;
			window.longitude=-77;
			
			//initialize main map and detail map
			var centermarker=[latitude, longitude];
			mapboxgl.accessToken = 'pk.eyJ1IjoicGV0ZXJxbGl1IiwiYSI6ImpvZmV0UEEifQ._D4bRmVcGfJvo1wjuOpA1g';
			var map = new mapboxgl.Map({
			  container: 'map', // container id
			  style: 'https://www.mapbox.com/mapbox-gl-styles/styles/outdoors-v4.json', //stylesheet location
			  center: centermarker, // starting position
			  zoom: 12, // starting zoom
			  interactive:true
			});



			var detailmap = new mapboxgl.Map({
			  container: 'detailedmap', // container id
			  style: 'https://www.mapbox.com/mapbox-gl-styles/styles/outdoors-v4.json', //stylesheet location
			  center: centermarker, // starting position
			  zoom: 12, // starting zoom
			});			
			
			
			//fetch data via 3taps
			window.array;
			window.searchparameters= {
				auth_token: "358297d537d9b89bd5b5720bbe255c65", 	
				rpp:'99',
				retvals:'id,images,price,annotations,location,timestamp',
				 category:"RHFR",
				 //source:'CRAIG',
				 radius:'3000m',
				 lat: latitude,
				 long: longitude,
				 price:'200..3000',
				 has_image:1,
				 has_price:1,
				 //annotations: '{latlong_source: "In Posting" AND cats:* AND dogs:* AND (attached_garage:yes OR carport:yes)}'
				};
			
			//search with typed input
		    function inputsearch()
				{//translate inputed city/ZIP into lat-lon
				var locationquery=$('#locationinput').val();
				geocoderurl='https://maps.googleapis.com/maps/api/geocode/json?address='+locationquery;
				$.get(geocoderurl).done(function(results) 
					{console.log(results);
					searchparameters['lat']=results['results'][0]['geometry']['location']['lat'];
					searchparameters['long']=results['results'][0]['geometry']['location']['lng'];	
					searchparameters['radius']='5mi';
					map.flyTo([results['results'][0]['geometry']['location']['lat'],results['results'][0]['geometry']['location']['lng']], 14,0,{speed:1,curve:4});
					dosearch();
					
					$('path.leaflet-clickable').remove();
					//L.circle([searchparameters['lat'],searchparameters['long']], 8050).addTo(map);

					})
				};	
			
			//search by radiused circle
			function circlesearch(lat,lon,radius) {
				searchparameters['lat']=lat;
				searchparameters['long']=lon;
				searchparameters['radius']=radius+'m';
				
				dosearch('fitbound');
			}

			//formats br/ba number
			function brbaformat(string) {
				if (string !==undefined)
					{return string
						.replace(/0br/g,'studio')
						.replace(/br/g,' bed')
						.replace(/ba/g,' bath');}
						
				else {return ''}
			}

			//execute search with provided parameters
			function dosearch(target){
				
				$('#loader').toggleClass('closed');
				$.get( "http://search.3taps.com", searchparameters)
					
					.done(function(data) {
				console.log('done fetching');
				$('#loader').toggleClass('closed');				
				//remove current markers
				$('.leaflet-marker-icon').remove();				
				array=data.postings;
				
				$('#listingcount').text(array.length+' listings found');
				//array to store latlons of all markers for map positioning purposes
				window.markerextent=[];
					
				//Place markers on map	
				for (var k=0;k<array.length;k++)
					{//define latlon
					var lat=array[k]['location']['lat']; 
					var lon=array[k]['location']['long'];
					
					//define bedroom number
					var bedroomquant=brbaformat(array[k]['annotations']['bedrooms']);





					
					//set default picture if listing doesn't have one
					if (array[k]['images'][0] !== undefined && array[k]['images'][0]['full'] !== undefined) {var image=array[k]['images'][0]['full']} 
					else {var image= 'http://www.peterma.de/secretrio/assets/selfie1.jpg'};
						


					$('#markerpane').append('<div class="leaflet-marker-icon closed" index="'+k+'" lat="'+lat+'" lon="'+lon+'""><div class="markertitle">'+bedroomquant+' • $'+array[k]['price']+'</div><img onload="openmarker(this)" class="" src="'+image+'"></div>')								
					}
					$('.leaflet-marker-icon').on('mousedown',function(){toggledetailview(); populatelisting(this)})
					trackmarkers('map','leaflet-marker-icon');


					map.on('move', function(){trackmarkers('map','leaflet-marker-icon')});
				})
			}	
					    
			inputsearch();
			function trackmarkers(mapidentifier,markers)
				{$('.'+markers)
					.each(function(index)
						{	var xpos=$(this).attr('lat');
							var ypos=$(this).attr('lon');
							var x=eval(mapidentifier).project([xpos,ypos])['x'];
							var y=eval(mapidentifier).project([xpos,ypos])['y'];
							$(this).css('-webkit-transform','translate('+x+'px, '+y+'px)');
						}
					)
				}			
			//pop open markers when their respective images load
			function openmarker(target)
				{$(target).parent().toggleClass('closed')};

			//open and close detail window
			function toggledetailview()
				{$("#detailview").toggleClass("open");
				 $('#detailtext').scrollTop(0)};
			
			//fetch heading, timestamp, HTML body text
			function fetchdetail(id,phone,email)
				{$.get( "http://search.3taps.com", 
					{auth_token: "358297d537d9b89bd5b5720bbe255c65",id:id,retvals:'html,heading,timestamp,external_url,price'})
				.done(function(data) 
					{
					//isolate and format listing body
					var html=atob(data.postings[0]['html']);
					var postingbody=html.substring(html.lastIndexOf('<section id="postingbody">')+26,html.lastIndexOf('<ul class="notices">'));
					postingbody=postingbody.replace(/â¢/g,'• ')			//get correct bullet point
											.replace(/,(?=[^\s])/g, ", ")	//force space after comma (if none already)
											.replace(/Â/g,'')			//delete this character
											.replace(/\r?\n|\r/g,'')	//remove carriage returns
											.replace(/gt;/g,'>')		//replace gt; with >
											.replace(/<br>{2,}/g, '');	//cap br's at 2
					console.log(postingbody);
					console.log(data.postings);
					var price='$'+data.postings[0]['price'];
					var heading=data.postings[0]['heading'].replace(price,'');
					
					$('#listingprice').text(price);
					$('#listingtitle').html(heading);
					$('#listingbody').html(postingbody);

					//Inject phone number into "show info"
					var formattedphone=function(i, phone) {
				        phone = phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
				        return phone;
    				}
					d3.selectAll('.showcontact').text(phone);

					$(".showcontact").text(function(i, text) {
				        text = text.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
				        return text;
    				});

					//update Contact and Listing buttons
					$('#contact').attr('href','https://mail.google.com/mail/u/0/?view=cm&fs=1&to='+email);					
					$('#listinglink').attr('href',data.postings[0]['external_url']);
	
					}
				)};
			
			//when user clicks on marker, scroll detailview to top, populates detail view with appropriate heading and body
			function populatelisting(target)
				{	var num=$(target).attr('index');
					var listing=array[num];
					console.log(num);
				$('.rewritable').html('(unknown)');
				$('#detailtext').scrollTop(0);
				console.log(listing['annotations']['source_account']);
				fetchdetail(listing['id'],listing['annotations']['phone'],listing['annotations']['source_account']);

				
				
				//calculate elapsed time since posting date
				var currenttime=(new Date().getTime())/1000;
				var postingtime; 
					if (listing['annotations']['original_posting_date']!== undefined){postingtime=listing['annotations']['original_posting_date']} 
					else {postingtime= listing['timestamp']};
				var difference=currenttime-postingtime;

				if(difference<3600){$('#dateposted').text(Math.round(difference/60)+' minutes ago')}
				else {if(difference<62400) {$('#dateposted').text(Math.round(difference/3600)+' hours ago')}
					else {$('#dateposted').text(Math.round(difference/86400)+' days ago')}
				}
				
				//remove preview images, insert new ones, set main image to 1st in list
				d3.selectAll('#preview img').remove();
				d3.select('#galleryimg').attr('src',listing['images'][0]['full']);
				var numpics=listing['images'].length;
				$('#preview').hide();

				if (numpics>1)
					{$('#preview').attr('style','display:inline-block');
					var scaleddown=(420/numpics)-2;
					
					var columns=Math.ceil(numpics/7);
					//$('#preview').attr('style','-webkit-column-count:'+columns);
				
					d3.select('#preview')
						.selectAll('img')
						.data(listing['images'])
						.enter()
						.append('img')
						.attr('style','width:'+scaleddown+'px;height:'+scaleddown+'px')
						.attr('src',function(d,i){return listing['images'][i]['full']})
						.on('mouseover',function(d,i){$('#galleryimg').attr('src',listing['images'][i]['full'])});}

					//center detail map to listing location								
					var lat=listing['location']['lat']; 
					var lon=listing['location']['long'];
					var annotations=listing['annotations'];
					console.log(annotations);
					//remove old marker, insert new marker, reset view on it,  and add tooltip containing intersection (via geonames API call)
					$('#detailedmap .leaflet-marker-icon').remove();
		
					detailmap.setView([lat,lon], 16,0);
					$('.detail-marker').attr('lat',lat).attr('lon',lon);
					trackmarkers('detailmap','detail-marker');
					detailmap.on('move', function(){trackmarkers('detailmap','detail-marker')});

					$.ajax({ url: 'http://api.geonames.org/findNearestIntersectionJSON?lat='+lat+'&lng='+lon+'&username=peterqliu', 
						success: function(data) { 
							$('.markerlabel')
								.html('<div style="padding:2px"><span class="streetname">'+data['intersection']['street1']+'</span> at <span class="streetname">'+data['intersection']['street2']+'</span></div>')
								.css('margin-left',$('.markerlabel').width()*-0.5+'px');
						}
					})	

					//populate bed/bath, price
					
					$('#bedbath').html(brbaformat(annotations['bedrooms'])+', '+brbaformat(annotations['bathrooms']) );
					$('#neighborhood').html(annotations['source_neighborhood']);			
				}
				
				
			var drawing='false';

			function drawcircle()
				{drawing='true';
				$('canvas').toggleClass('drawmode');
					//remove existing circles
					//$('path.leaflet-clickable').remove();
					
					//temporarily disable map drag
					map.options.interactive=false;
					
					map.on('mousedown', function(e) {
						console.log('down');

						window.centerlatlon=[map.unproject(e.point).lat, map.unproject(e.point).lng];
						map.on('mousemove',function(e)
							{var mileradius= 0.000621371*(L.latLng(centerlatlon[0],centerlatlon[1]).distanceTo([map.unproject(e.point).lat, map.unproject(e.point).lng]));
								d3.select('#radiusdistance')
									.text(Math.round(mileradius*10)/10+'');
							});			
					});		
							
					$('#map').mousedown(function(e)
						{$('#circledraw').toggle();
						
						var circlecenter=[e.pageX,e.pageY];
						d3.select('#center')
						.attr('cx',circlecenter[0])
						.attr('cy',circlecenter[1]);	
												
						d3.select('#outer')
						.attr('cx',circlecenter[0])
						.attr('cy',circlecenter[1])
						.attr('r',0);

						d3.select('#drawradius')
							.attr('opacity',0);

						d3.select('#radiusdistance')
							.attr('x',circlecenter[0])
							.attr('y',circlecenter[1]+4)
							.attr('font-size','1.2em')
							.text('');		

						d3.select('#miles')
							.attr('x',circlecenter[0])
							.attr('y',circlecenter[1]+15)
							.attr('font-size','0.7em')

							$('#map').mousemove(function(e)
							{ if(drawing=='true' && e.which==1)
								{var radius=Math.pow(Math.pow(e.pageX-circlecenter[0],2)+Math.pow(e.pageY-circlecenter[1],2), 0.5);
								d3.select('#outer')
									.attr('r', radius)
									.attr('fill-opacity',Math.pow(0.9,(radius*0.1)));
								
								d3.select('#drawradius')
									.attr('opacity',1)
									.attr('x2',e.pageX)
									.attr('y2',e.pageY)
									.attr('x1',circlecenter[0])
									.attr('y1',circlecenter[1]);

	
								}
							}
						)
						})
						map.on('mouseup',function(e){if (drawing=='true')
								{canceldraw();
								var meterradius= L.latLng(centerlatlon[0],centerlatlon[1]).distanceTo([map.unproject(e.point).lat, map.unproject(e.point).lng]);
								//L.circle(centerlatlon, meterradius).addTo(map);
								circlesearch(centerlatlon[0],centerlatlon[1],meterradius);
								}
								drawing='false';
							})
				}		
			function canceldraw(){
				$('#map').toggleClass('drawmode');
				map.options.interactive=true;
				$('#circledraw').hide();
				$('#map').unbind('mousedown');
				$('#map').unbind('mousemove');
			}
				//Price scrubber functionality
				  var currentmin=200;
				  var initialmin;
				  var currentmax=3000;
				  var initialmax;
				  
				  var minprice=0;
				  var maxprice=10000;
				  
				  var minactive;
				  var maxactive;
				  
				  $('#minrent').on('mousedown',function(e)
				  {minactive=true; var initialx=e.pageX; initialmin=currentmin;
						$('body').mousemove(function(e)
					  	{window.xdrag=Math.round(e.pageX-initialx)*10;
						if (minactive && xdrag%10==0 && initialmin+xdrag>minprice && initialmin+xdrag<currentmax)
							{currentmin=initialmin+xdrag;
							$('#minrent').text('$'+currentmin);}
				        }
				      )
				    }
				  );
				
				  $('#maxrent').on('mousedown',function(e)
				    {maxactive=true; var initialx=e.pageX; initialmax=currentmax;
				    	
				      $('body').mousemove(function(e)
				        {window.xdrag=Math.round(e.pageX-initialx)*10;
				        if (maxactive && xdrag%10==0 && initialmax+xdrag>currentmin && initialmax+xdrag<maxprice)
				        	{currentmax=initialmax+xdrag;
				        	$('#maxrent').text('$'+currentmax);}
				        }     
				      )
				    }
				  ).mouseup()
				  $('body').on('mouseup', function() 
				  {if (minactive==true || maxactive==true)
				  {searchparameters['price']=currentmin+'..'+currentmax;dosearch();minactive=false;maxactive=false;}})				
