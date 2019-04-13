'use strict';
$( document ).ready(function() {
    //Add new direction
    $('.block__line-add').click(function(){
        $(".block__add").css('display', 'block');
        $("table").css('opacity', '0.5');
    });

    $(".button-add").click(function(){
        var code =  $("#field-code").val();
        var name =  $("#field-name").val();

        if(!(code.trim() == '' || name.trim() == '')){
            $.ajax({
                type:"POST",
                url:'/addDirection',
                data:{code:code,name:name},
                success: function(result){
                str = '';
                if(result)
                    for(let i = 0; i < result.length;i++ ){
                        var str = '<th id="info-id">'+ result[i].id +'</th><th id="info-code">'+ result[i].code +'</th><th id="info-dir">'+ result[i].direction +'</th>';
                    }
                    $('.table_body').append(str);
                    alert("Готово!"); },
                error: function(){
                    alert("Ошибка!");
                }
        });
            $(".block__add").css('display', 'none');
            $("table").css('opacity', '1');

        }else{
            $("#field-code").css('box-shadow', '0 0 10px red');
            $("#field-name").css('box-shadow', '0 0 10px red');
        }
       
     });

    //Cancel
    $(".button__cancel-add").click(function(){
        $(".block__add").css('display', 'none');
        $("table").css('opacity', '1');
    });
    $(".button__cancel-del").click(function(){
        $(".block__add").css('display', 'none');
        $("table").css('opacity', '1');
    });

    //Delete direction
    $('.block__line-del').click(function(event){
        console.log(event)
        var conf = confirm("Вы действительно хотите удалить запись?");
        if (del) {
			$.ajax({
                type:"POST",
                url:'/deleteDirection',
                data:{id:row.find("#id").text()},
                success: function(result){
                str = '';
                if(result)
                    for(let i = 0; i < result.length;i++ ){
                        var str = '<th id="info-id">'+ result[i].id +'</th><th id="info-code">'+ result[i].code +'</th><th id="info-dir">'+ result[i].direction +'</th>';
                    }
                    $('.table_body').append(str);
                    alert("Готово!"); },
                error: function(){
                    alert("Ошибка!");
                }
        });
		}
    });

});