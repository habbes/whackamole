#!/usr/bin/python
from flask import Flask, request


app = Flask(__name__)


@app.route('/')
def status():
    return { 'ok': True }


if __name__ == '__main__':
    app.run(debug=True, port=5000)