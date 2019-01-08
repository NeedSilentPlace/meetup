// Load application styles
import 'styles/index.less';
import {mapStyle} from 'mapStyle.js';
// ================================
// START YOUR APP HERE
// ================================
const favoriteStorage = window.localStorage;
const home = document.querySelector('.home');
const sweden = {lat: 59.32, lng: 18.07};
const markersArray = [];
const meetupLogo = document.querySelector('.meetupLogo');
const addButton = document.querySelector('.add');
const deleteButton = document.querySelector('.delete');
const heartIcon = document.querySelector('.favorite');
const exit = document.querySelector('.exit');
const selectedData = {};
let isHeartClicked = false;
let map;

document.querySelector('.favoriteNumber').textContent = favoriteStorage.length - 1;
addButton.addEventListener('click', addFavorite);
deleteButton.addEventListener('click', deleteFavorite);
heartIcon.addEventListener('click', favoriteVisualizer);
exit.addEventListener('click', exitFavorite);
home.addEventListener('click', () => {
  window.location.reload();
});

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
    center: sweden,
    zoom: 8,
    styles: mapStyle
  });

  map.addListener('click', (ev) => {
    const informationBox = document.querySelector('.informationBox');
    const meetupBox = document.querySelector('.meetupBox');
    const newMeetupBox = document.createElement('div');

    meetupLogo.classList.remove('displayNone');
    meetupLogo.classList.add('loading');
    informationBox.removeChild(meetupBox);
    newMeetupBox.classList.add('meetupBox');
    informationBox.appendChild(newMeetupBox);

    deleteMarker();
    addMarker(ev.latLng);
    requestMeetupData(ev.latLng.lat(), ev.latLng.lng());
  });
}

function addMarker(latLng) {
  const marker = new google.maps.Marker({
    map: map,
    position: latLng
  });

  markersArray.push(marker);
}

function deleteMarker() {
  for(let i = 0; i < markersArray.length; i++) {
    markersArray[i].setMap(null);
  }
}

function requestMeetupData(lat, lng) {
  $.ajax({
    url: `https://api.meetup.com/find/upcoming_events?&sign=true&key=603c3d73f4e35466617592a56d31&page=10&radius=8&lon=${lng}&lat=${lat}`,
    dataType: 'jsonp',
    success: meetupDataFilter
  });
}

function meetupDataFilter(area) {
  const eventData = [];

  if(area.data.errors) {
    meetupLogo.classList.remove('loading');

    return alert('There is no city.. Please click again!');
  } else {
    const events = area.data.events;

    if(!events.length) {
      meetupLogo.classList.remove('loading');
      return alert('There is no meetup.. Please click another city!');
    }
    
    for(let i = 0; i < events.length; i++) {
      const event = {};
      
      event.id = events[i].id;
      event.urlName = events[i].group.urlname;
      event.eventName = events[i].name;
      event.time = `${events[i].local_date} ${events[i].local_time}`;
      event.groupName = events[i].group.name;
      event.eventLink =events[i].link;

      if(events[i].rsvp_limit) {
        event.rsvpLimit = events[i].rsvp_limit;
      } else {
        event.rsvpLimit = 'none';
      }

      if(events[i].waitlist_count) {
        event.waitlist = events[i].waitlist_count;
      } else {
        event.waitlist = 'none';
      }

      event.yesRsvp = events[i].yes_rsvp_count;
      eventData.push(event);
    }

    requestHostData(eventData);
  }
}

function requestHostData(eventData) {
  const finalData = [...eventData];
  const hostPromiseArray = [];

  for(let i = 0; i < eventData.length; i++) {
    const hostData = new Promise(function(resolve, reject) {
      $.ajax({
        url: `https://api.meetup.com/${eventData[i].urlName}/events/${eventData[i].id}/hosts`,
        dataType: 'jsonp',
        success: resolve
      });
    });

    hostPromiseArray.push(hostData);
  }

  Promise.all(hostPromiseArray).then((host) => {
    for(let i = 0; i < host.length; i++) {
      const nameAndPhoto = host[i].data;
      const name = [];
      const photo = [];

      for(let j = 0; j < nameAndPhoto.length; j++) {
        name.push(nameAndPhoto[j].name);

        if(nameAndPhoto[j].photo) {
          photo.push(nameAndPhoto[j].photo.photo_link);
        } else {
          photo.push('https://www.freeiconspng.com/uploads/no-image-icon-11.PNG');
        }
      }

      finalData[i].name = name;
      finalData[i].photo = photo;
    }

    for(let k = 0; k < finalData.length; k++) {
      document.querySelector('.meetupBox').appendChild(dataVisualizer(finalData[k]));
    }

    meetupLogo.classList.add('displayNone');
    meetupLogo.classList.remove('loading');
    document.querySelector('.meetupBox').classList.add('active');
  });
}

function dataVisualizer(data, isFavorite = false) {
  const unit = document.createElement('div');
  const contentBox = document.createElement('div');  
  const nameBox = document.createElement('div');
  const numberBox = document.createElement('div');
  const pictureBox = document.createElement('div');
  const eventName = document.createElement('a');
  const groupName = document.createElement('span');
  const time = document.createElement('span');
  const rsvp = document.createElement('span');
  const br = document.createElement('br');
  const clickCircle = document.createElement('div');

  unit.classList.add('unit');
  clickCircle.classList.add('clickCircle');
  contentBox.classList.add('contentBox');
  eventName.href = data.eventLink;
  eventName.target = '_blank';
  eventName.classList.add('eventName');
  eventName.textContent = data.eventName;
  groupName.classList.add('groupName');
  groupName.textContent = `by ${data.groupName}`;
  time.classList.add('time');
  time.textContent = data.time;
  rsvp.classList.add('rsvp');
  rsvp.textContent = `rsvp limit : ${data.rsvpLimit} | rsvp :  ${data.yesRsvp} | wait list : ${data.waitlist}`;

  if(isFavorite) {
    unit.classList.add('favoriteColor');
  }

  if(!isFavorite) {
    clickCircle.textContent = '+';
  } else {
    clickCircle.textContent = '-';
  }

  for(let i = 0; i < data.name.length; i++) {
    const img = document.createElement('img');

    img.src = data.photo[i];
    img.title = data.name[i];
    img.classList.add('picture');
    pictureBox.appendChild(img);
  }

  nameBox.appendChild(eventName);
  nameBox.appendChild(br);
  nameBox.appendChild(groupName);
  numberBox.appendChild(time);
  numberBox.appendChild(rsvp);
  contentBox.appendChild(nameBox);
  contentBox.appendChild(numberBox);
  contentBox.appendChild(pictureBox);
  unit.appendChild(clickCircle);
  unit.appendChild(contentBox);

  if(!isFavorite) {
    clickCircle.addEventListener('click', (ev) => {
      if(selectedData[data.id]) {
        ev.target.classList.remove('selected');
        delete selectedData[data.id];
      } else {
        selectedData[data.id] = JSON.stringify(data);
        ev.target.classList.add('selected');
      }
    });
  } else {
    clickCircle.addEventListener('click', (ev) => {
      if(selectedData[data.id]) {
        ev.target.classList.remove('selected');
        delete selectedData[data.id];
      } else {
        selectedData[data.id] = JSON.stringify(data);
        ev.target.classList.add('selected');
      }
    });
  }

  return unit;
}

function addFavorite() {
  const selectedEvent = document.querySelectorAll('.selected');
  const meetupBox = document.querySelector('.meetupBox'); 

  heartIcon.classList.add('heartSizeUp');

  for(let key in selectedData) {
    favoriteStorage.setItem(JSON.stringify(key), selectedData[key]);
    delete selectedData[key];
  }
  
  for(let i = 0; i < selectedEvent.length; i++) {
      selectedEvent[i].parentElement.classList.add('addAnimation');
  }

  setTimeout(function() {
    for(let j = 0; j < selectedEvent.length; j++) {
      meetupBox.removeChild(selectedEvent[j].parentElement);
    }

    heartIcon.classList.remove('heartSizeUp');
    document.querySelector('.favoriteNumber').textContent = favoriteStorage.length - 1;
  }, 500);
}

function deleteFavorite() {
  const selectedEvent = document.querySelectorAll('.selected');
  const favoriteBox = document.querySelector('.favoriteBox');

  heartIcon.classList.add('heartSizeDown');

  for(let key in selectedData) {
    favoriteStorage.removeItem(JSON.stringify(key));
    delete selectedData[key];
  }

  for(let i = 0; i < selectedEvent.length; i++) {
    selectedEvent[i].parentElement.classList.add('addAnimation');
  }

  setTimeout(function() {
    for(let j = 0; j < selectedEvent.length; j++) {
      favoriteBox.removeChild(selectedEvent[j].parentElement);
    }

    document.querySelector('.favoriteNumber').textContent = favoriteStorage.length - 1;
    heartIcon.classList.remove('heartSizeDown');
  }, 500);
}

function favoriteVisualizer() {
  if(isHeartClicked) {
    return;
  }
  const favoriteBox = document.querySelector('.favoriteBox');

  isHeartClicked = true;
  favoriteBox.classList.add('showFavorite');
  document.querySelector('.blinder').classList.add('active');
  document.querySelector('.mapBox').classList.add('inactive');
  document.querySelector('.meetupBox').classList.add('inactive');
  document.querySelector('.delete').classList.add('showDeleteExit');
  document.querySelector('.exit').classList.add('showDeleteExit');
  document.querySelector('.favorite').classList.add('moveHeart');
  document.querySelector('.add').classList.add('displayNone');

  for(let key in favoriteStorage) {
    if(favoriteStorage.hasOwnProperty(key) && key !== 'loglevel:webpack-dev-server') {
      const favoriteData = JSON.parse(favoriteStorage.getItem(key));
      favoriteBox.appendChild(dataVisualizer(favoriteData, true));
    }
  }
}

function exitFavorite() {
  const favoriteBox = document.querySelector('.favoriteBox');
  
  isHeartClicked = false;
  favoriteBox.classList.remove('showFavorite');
  document.querySelector('.blinder').classList.remove('active');
  document.querySelector('.mapBox').classList.remove('inactive');
  document.querySelector('.meetupBox').classList.remove('inactive');
  document.querySelector('.delete').classList.remove('showDeleteExit');
  document.querySelector('.exit').classList.remove('showDeleteExit');
  document.querySelector('.favorite').classList.remove('moveHeart');
  document.querySelector('.add').classList.remove('displayNone');

  while(favoriteBox.children.length > 0) {
    favoriteBox.removeChild(favoriteBox.children[0]);
  }
}

$.ajax({
  url: "https://maps.googleapis.com/maps/api/js?key=AIzaSyAeOFU6LK6dWgzZHUFdeCIKiUYdu5BzPGU&language=en",
  dataType: 'jsonp',
  success: initMap
});

// You can use jquery for ajax request purpose only.
import $ from 'jquery';
