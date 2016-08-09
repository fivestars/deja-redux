import json

import tornado.ioloop
import tornado.web
import tornado.websocket

class Channel(object):

    def __init__(self, name):
        self.name = name
        self.subscribers = []

    def subscribe(self, subscriber):
        self.subscribers.append(subscriber)

    def unsubscribe(self, subscriber):
        if subscriber in self.subscribers:
            self.subscribers.remove(subscriber)

    def publish(self, message):
        for subscriber in self.subscribers:
            try:
                subscriber(message)
            except:
                pass


class ChannelManager(object):

    channels = {}

    @classmethod
    def get(cls, channel_name):
        if channel_name not in cls.channels:
            cls.channels[channel_name] = Channel(channel_name)
        return cls.channels[channel_name]


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello World")


class AllOriginsWebSocketHandler(tornado.websocket.WebSocketHandler):

    def check_origin(self, origin):
        return True


class SubscribeHandler(AllOriginsWebSocketHandler):
    def open(self, channel_name):
        self.channel = ChannelManager.get(channel_name)
        self.channel.subscribe(self.on_incoming_message)

    def on_incoming_message(self, message):
        self.write_message(message)

    def on_close(self):
        if hasattr(self, "channel"):
            self.channel.unsubscribe(self.on_incoming_message)

class PublishHandler(AllOriginsWebSocketHandler):
    def open(self, channel_name):
        print("Opening publisher on {}.".format(channel_name))
        self.channel = ChannelManager.get(channel_name)

    def on_message(self, raw_message):
        print("Got raw message {}".format(raw_message))
        message = json.loads(raw_message)
        self.channel.publish(message)

def make_app():
    return tornado.web.Application([
        (r"/", MainHandler),
        (r"/sub/([0-9a-zA-Z_-]+)/", SubscribeHandler),
        (r"/pub/([0-9a-zA-Z_-]+)/", PublishHandler),
    ])

if __name__ == "__main__":
    app = make_app()
    app.listen(8888)
    tornado.ioloop.IOLoop.current().start()
