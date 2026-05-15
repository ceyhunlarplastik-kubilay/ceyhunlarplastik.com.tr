export var Example;
(function (Example) {
    function hello() {
        return "Hello, world!";
    }
    Example.hello = hello;
})(Example || (Example = {}));
