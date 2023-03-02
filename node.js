const { google } = require('googleapis');

// Google APIクライアントの認証設定
const auth = new google.auth.OAuth2(
  751071266798-gh032qesp61jpv5jujv086bgp7nflij3.apps.googleusercontent.com,
  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,
  https://calendar.google.com/calendar/embed?src=senaym0802work%40gmail.com&ctz=Asia%2FTokyo
  //上のURLに関してはhttps://blog.shinonome.io/google-api/承認済みURLを設定する
);

// カレンダーのイベントを取得するAPI呼び出し
const calendar = google.calendar({ version: 'v3', auth });
calendar.events.list({
  calendarId: 'primary',
  timeMin: new Date().toISOString(),
  maxResults: 10,
  singleEvents: true,
  orderBy: 'startTime',
}, (err, res) => {
  if (err) return console.log(`The API returned an error: ${err}`);
  const events = res.data.items;
  if (events.length) {
    console.log('Upcoming events:');
    events.map((event, i) => {
      const start = event.start.dateTime || event.start.date;
      console.log(`${start} - ${event.summary}`);
    });
  } else {
    console.log('No upcoming events found.');
  }
});
// 空いている時間のスロットを取得する関数
async function getAvailableSlots(startDate, endDate, intervalInMinutes) {
  const calendar = google.calendar({ version: 'v3', auth });

  // カレンダーのイベントを取得
  const events = await calendar.events.list({
    calendarId: 'primary',
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  // イベントを開始時間でソートする
  const sortedEvents = events.data.items.sort((a, b) => {
    return new Date(a.start.dateTime || a.start.date) - new Date(b.start.dateTime || b.start.date);
  });

  // イベントの時間の重複をマージする
  const mergedEvents = [];
  let currentEvent = sortedEvents[0];
  for (let i = 1; i < sortedEvents.length; i++) {
    const nextEvent = sortedEvents[i];
    const currentEventEnd = new Date(currentEvent.end.dateTime || currentEvent.end.date);
    const nextEventStart = new Date(nextEvent.start.dateTime || nextEvent.start.date);
    if (currentEventEnd < nextEventStart) {
      mergedEvents.push(currentEvent);
      currentEvent = nextEvent;
    } else {
      currentEvent.end = nextEvent.end;
    }
  }
  mergedEvents.push(currentEvent);

  // 空いている時間のスロットを計算する
  const availableSlots = [];
  let startTime = startDate;
  for (let i = 0; i < mergedEvents.length; i++) {
    const event = mergedEvents[i];
    const eventStart = new Date(event.start.dateTime || event.start.date);
    const eventEnd = new Date(event.end.dateTime || event.end.date);
    if (startTime < eventStart) {
      const endTime = eventStart;
      const durationInMinutes = Math.round((endTime - startTime) / (1000 * 60));
      if (durationInMinutes >= intervalInMinutes) {
        const startTimeString = startTime.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
        const endTimeString = endTime.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
        availableSlots.push(`${startTimeString}〜${endTimeString}`);
      }
      startTime = eventEnd;
    } else {
      startTime = eventEnd;
    }
  }
  if (startTime < endDate) {
    const endTime = endDate;
    const durationInMinutes = Math.round((endTime - startTime) / (1000 * 60));
    if (durationInMinutes >= intervalInMinutes) {
      const startTimeString = startTime.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
      const endTimeString = endTime.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
      availableSlots.push(`${startTimeString}〜${endTimeString}`);
    }
  }
  return availableSlots;
}
// 希望の間隔でフィルタリングされた空いている時間から、3つの候補を返す関数
async function getAvailableTimeSlots(intervalInMinutes, numOfSlots) {
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + (numOfSlots * 2 - 1) * 24 * 60 * 60 * 1000);
  const availableSlots = await getAvailableSlots(startDate, endDate, intervalInMinutes);

  const timeSlots = [];
  let i = 0;
  while (i < availableSlots.length && timeSlots.length < numOfSlots) {
    const slot = availableSlots[i];
    const startTime = new Date(slot.split('〜')[0]);
    const endTime = new Date(slot.split('〜')[1]);
    const dateString = startTime.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
    const timeString = `${startTime.getHours()}時〜${endTime.getHours()}時`;
    timeSlots.push(`${dateString}(${timeString})`);
    i++;
  }

  return timeSlots;
}
const intervalInMinutes = 60;
const numOfSlots = 3;
const timeSlots = await getAvailableTimeSlots(intervalInMinutes, numOfSlots);
console.log(timeSlots);
