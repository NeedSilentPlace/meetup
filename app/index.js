// Load application styles
import 'styles/index.less';

// ================================
// START YOUR APP HERE
// ================================
const favoriteStorage = window.localStorage;
document.querySelector('.favoriteNumber').textContent = favoriteStorage.length - 1;

const home = document.querySelector('.home');
home.addEventListener('click', function() {
  window.location.reload();
});

$.ajax({
  url: "https://maps.googleapis.com/maps/api/js?key=AIzaSyAeOFU6LK6dWgzZHUFdeCIKiUYdu5BzPGU&language=en",
  dataType: 'jsonp',
  success: initMap
});

const sweden = {lat: 59.32, lng: 18.07};
const markersArray = [];
let map;

const icon = document.querySelector('.icon');

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
    center: sweden,
    zoom: 10,
    styles: [
      {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
      {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
      {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
      {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{color: '#d59563'}]
      },
      {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [{color: '#d59563'}]
      },
      {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{color: '#263c3f'}]
      },
      {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [{color: '#6b9a76'}]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{color: '#38414e'}]
      },
      {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{color: '#212a37'}]
      },
      {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [{color: '#9ca5b3'}]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{color: '#746855'}]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{color: '#1f2835'}]
      },
      {
        featureType: 'road.highway',
        elementType: 'labels.text.fill',
        stylers: [{color: '#f3d19c'}]
      },
      {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [{color: '#2f3948'}]
      },
      {
        featureType: 'transit.station',
        elementType: 'labels.text.fill',
        stylers: [{color: '#d59563'}]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{color: '#17263c'}]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{color: '#515c6d'}]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.stroke',
        stylers: [{color: '#17263c'}]
      }
    ]
  });

  map.addListener('click', function(ev) {
    let informationBox = document.querySelector('.informationBox');
    let meetupBox = document.querySelector('.meetupBox');
    let newMeetupBox = document.createElement('div');

    icon.classList.remove('displayNone');
    icon.classList.add('loading');
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
  let url = `https://api.meetup.com/find/upcoming_events?&sign=true&key=603c3d73f4e35466617592a56d31&page=10&radius=8&lon=${lng}&lat=${lat}`;

  $.ajax({
    url: url,
    dataType: 'jsonp',
    success: meetupDataFilter
  });
}

function meetupDataFilter(area) {
  const eventData = [];

  if(area.data.errors) {
    icon.classList.remove('loading');
    return alert('There is no city.. Please click again!');
  } else {
    const events = area.data.events;

    if(!events.length) {
      icon.classList.remove('loading');
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

    getHostData(eventData);
  }

}

function getHostData(eventData) {
  const finalData = [...eventData];
  const hostPromiseArray = [];

  for(let i = 0; i < eventData.length; i++) {
    let hostData = new Promise(function(resolve, reject) {
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
      let nameAndPhoto = host[i].data;
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
    document.querySelector('.meetupBox').classList.add('showBlinder');
    let icon = document.querySelector('.icon');
    icon.classList.add('displayNone');
    icon.classList.remove('loading');
  });
}

const selectedData = {};

function dataVisualizer(data, isFavorite = false) {
  let box = document.createElement('div');
  box.classList.add('unit');
  if(isFavorite) {
    box.classList.add('favoriteColor');
  }
  let clickCircle = document.createElement('div');
  clickCircle.classList.add('clickCircle');

  if(!isFavorite) {
    clickCircle.textContent = '+';
  } else {
    clickCircle.textContent = '-';
  }

  let contentBox = document.createElement('div');
  contentBox.classList.add('contentBox');
  let nameBox = document.createElement('div');
  let numberBox = document.createElement('div');
  let pictureBox = document.createElement('div');
  let eventName = document.createElement('a');
  eventName.href = data.eventLink;
  eventName.target = '_blank';
  eventName.classList.add('eventName');
  eventName.textContent = data.eventName;
  let groupName = document.createElement('span');
  let br = document.createElement('br');
  groupName.classList.add('groupName');
  groupName.textContent = `by ${data.groupName}`;
  nameBox.appendChild(eventName);
  nameBox.appendChild(br);
  nameBox.appendChild(groupName);
  let time = document.createElement('span');
  time.classList.add('time');
  time.textContent = data.time;
  let rsvp = document.createElement('span');
  rsvp.classList.add('rsvp');
  rsvp.textContent = `rsvp limit : ${data.rsvpLimit} | rsvp :  ${data.yesRsvp} | wait list : ${data.waitlist}`;
  numberBox.appendChild(time);
  numberBox.appendChild(rsvp);


  for(let i = 0; i < data.name.length; i++) {
    let img = document.createElement('img');
    img.src = data.photo[i];
    img.title = data.name[i];
    img.classList.add('picture');
    pictureBox.appendChild(img);
  }

  contentBox.appendChild(nameBox);
  contentBox.appendChild(numberBox);
  contentBox.appendChild(pictureBox);

  box.appendChild(clickCircle);
  box.appendChild(contentBox);

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

  return box;
}

const addButton = document.querySelector('.add');

addButton.addEventListener('click', function(ev) {
  for(let key in selectedData) {
    favoriteStorage.setItem(JSON.stringify(key), selectedData[key]);
    delete selectedData[key];
  }
  
  let selectedEvent = document.querySelectorAll('.selected');
  
  for(let i = 0; i < selectedEvent.length; i++) {
      selectedEvent[i].parentElement.classList.add('addAnimation');
  }

  let heartIcon = document.querySelector('.favorite');
  heartIcon.classList.add('heartSizeUp');

  setTimeout(function() {
    let meetupBox = document.querySelector('.meetupBox');
    for(let j = 0; j < selectedEvent.length; j++) {
      meetupBox.removeChild(selectedEvent[j].parentElement);
    }
    heartIcon.classList.remove('heartSizeUp');
    document.querySelector('.favoriteNumber').textContent = favoriteStorage.length - 1;
  }, 500);
});

const deleteButton = document.querySelector('.delete');

deleteButton.addEventListener('click', function(ev) {
  for(let key in selectedData) {
    favoriteStorage.removeItem(JSON.stringify(key));
    delete selectedData[key];
  }

  let selectedEvent = document.querySelectorAll('.selected');

  for(let i = 0; i < selectedEvent.length; i++) {
    selectedEvent[i].parentElement.classList.add('addAnimation');
  }

  let heartIcon = document.querySelector('.favorite');
  heartIcon.classList.add('heartSizeDown');

  setTimeout(function() {
    let favoriteBox = document.querySelector('.favoriteBox');
    for(let j = 0; j < selectedEvent.length; j++) {
      favoriteBox.removeChild(selectedEvent[j].parentElement);
    }
    document.querySelector('.favoriteNumber').textContent = favoriteStorage.length - 1;
    heartIcon.classList.remove('heartSizeDown');
  }, 500);
});


let isFavoriteClicked = false;
const favorite = document.querySelector('.favorite');
favorite.addEventListener('click', favoriteVisualizer);

function favoriteVisualizer(ev) {
  if(isFavoriteClicked) {
    return;
  }
  isFavoriteClicked = true;
  const favoriteBox = document.querySelector('.favoriteBox');
  
  for(let key in favoriteStorage) {
    if(favoriteStorage.hasOwnProperty(key) && key !== 'loglevel:webpack-dev-server') {
      let favoriteData = JSON.parse(favoriteStorage.getItem(key));
      favoriteBox.appendChild(dataVisualizer(favoriteData, true));
    }
  }

  document.querySelector('.blinder').classList.add('showBlinder');
  document.querySelector('.mapBox').classList.add('disappear');
  document.querySelector('.meetupBox').classList.add('disappear');
  document.querySelector('.delete').classList.add('showDeleteExit');
  document.querySelector('.exit').classList.add('showDeleteExit');
  document.querySelector('.favorite').classList.add('moveHeart');
  document.querySelector('.add').classList.add('displayNone');
  favoriteBox.classList.add('showFavorite');
}

const exit = document.querySelector('.exit');
exit.addEventListener('click', exitFavorite);

function exitFavorite(ev) {
  const favoriteBox = document.querySelector('.favoriteBox');
  
  isFavoriteClicked = false;
  document.querySelector('.blinder').classList.remove('showBlinder');
  document.querySelector('.mapBox').classList.remove('disappear');
  document.querySelector('.meetupBox').classList.remove('disappear');
  document.querySelector('.delete').classList.remove('showDeleteExit');
  document.querySelector('.exit').classList.remove('showDeleteExit');
  document.querySelector('.favorite').classList.remove('moveHeart');
  document.querySelector('.add').classList.remove('displayNone');
  favoriteBox.classList.remove('showFavorite');

  while(favoriteBox.children.length > 0) {
    favoriteBox.removeChild(favoriteBox.children[0]);
  }
}

// You can use jquery for ajax request purpose only.
import $ from 'jquery';

