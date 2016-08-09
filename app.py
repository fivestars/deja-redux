import json

import tornado.ioloop
import tornado.web
import tornado.websocket

class ChannelExistsError(Exception):
    pass

class ChannelDoesNotExistError(Exception):
    pass

class ReduxChannel(object):

    def __init__(self, name, manager, publisher=None):
        self.name = name
        self.manager = manager
        self.publisher = publisher
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

    def close(self):
        close_message = {
            "action": "CHANNEL_CLOSED",
            "payload": {
                "name": self.name
            }
        }
        self.publish(close_message)
        self.subscribers = []
        self.publisher = None
        self.manager.closed(self.name)


class ReduxChannelManager(object):

    channels = {}

    @classmethod
    def create(cls, channel_name, publisher=None):
        if channel_name in cls.channels:
            raise ChannelExistsError
        cls.channels[channel_name] = ReduxChannel(channel_name, manager=cls, publisher=publisher)
        return cls.channels[channel_name]

    @classmethod
    def get(cls, channel_name):
        if channel_name not in cls.channels:
            raise ChannelDoesNotExistError
        return cls.channels[channel_name]

    @classmethod
    def subscribe(cls, channel_name, subscriber):
        channel = cls.get(channel_name)
        channel.subscribe(subscriber)
        return channel

    @classmethod
    def closed(cls, channel_name):
        if channel_name in cls.channels:
            del cls.channels[channel_name]


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello World")


class AllOriginsWebSocketHandler(tornado.websocket.WebSocketHandler):

    def check_origin(self, origin):
        return True


class SubscribeHandler(AllOriginsWebSocketHandler):
    def open(self, channel_name):
        self.channel = ReduxChannelManager.subscribe(channel_name, self.on_incoming_message)

    def on_incoming_message(self, message):
        self.write_message(message)

    def on_close(self):
        self.channel.unsubscribe(self.on_incoming_message)

class PublishHandler(AllOriginsWebSocketHandler):
    def open(self, channel_name):
        print("Opening publisher on {}.".format(channel_name))
        self.channel = ReduxChannelManager.create(channel_name, publisher=self)

    def on_message(self, raw_message):
        print("Got raw message {}".format(raw_message))
        message = json.loads(raw_message)
        self.channel.publish(message)

    def on_close(self):
        self.channel.close()

def make_app():
    return tornado.web.Application([
        (r"/", MainHandler),
        (r"/sub/([a-z]+)/", SubscribeHandler),
        (r"/pub/([a-z]+)/", PublishHandler),
    ])

if __name__ == "__main__":
    app = make_app()
    app.listen(8888)
    tornado.ioloop.IOLoop.current().start()
