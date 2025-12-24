from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from .models import Survey, Question, Choice, Respondent, Response
from openpyxl import Workbook
from django.http import HttpResponse, FileResponse, Http404
import json
import qrcode
from io import BytesIO
import base64
from django.urls import reverse
from wordcloud import WordCloud
from collections import Counter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
import tempfile
from django.contrib.auth.decorators import login_required

# ===============================
# HELPERS DE SÉCURITÉ
# ===============================

def get_survey_or_404(request, survey_id):
    user = request.user
    if user.is_staff or user.is_superuser:
        return get_object_or_404(Survey, id=survey_id)
    return get_object_or_404(Survey, id=survey_id, owner=user)


def get_public_survey_or_404(survey_id):
    return get_object_or_404(Survey, id=survey_id)


# ===============================
# UTILS
# ===============================

def generate_wordcloud_and_stats(text_list):
    full_text = " ".join(text_list).lower()
    if not full_text.strip():
        return None, []

    wc = WordCloud(width=600, height=400, background_color="white").generate(full_text)
    buffer = BytesIO()
    wc.to_image().save(buffer, format="PNG")

    img_b64 = base64.b64encode(buffer.getvalue()).decode()
    words = [w for w in full_text.split() if len(w) > 3]
    freq = Counter(words).most_common(10)
    return img_b64, freq


def generate_qr_for_survey(request, survey):
    base_url = request.build_absolute_uri('/')[:-1]
    qr_url = base_url + reverse('take_survey', args=[survey.id])

    qr = qrcode.make(qr_url)
    buffer = BytesIO()
    qr.save(buffer, format="PNG")

    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{qr_base64}"


# ===============================
# DASHBOARD (PRIVÉ)
# ===============================

@login_required
def survey_list(request):
    if request.user.is_staff or request.user.is_superuser:
        surveys = Survey.objects.all()
    else:
        surveys = Survey.objects.filter(owner=request.user)
    return render(request, 'survey/survey_list.html', {'surveys': surveys})


@login_required
def survey_create(request):
    if request.method == "POST":
        survey = Survey.objects.create(
            title=request.POST.get("title", "").strip(),
            description=request.POST.get("description", "").strip(),
            owner=request.user
        )

        texts = request.POST.getlist("question_text[]")
        types = request.POST.getlist("question_types[]")

        for i, text in enumerate(texts):
            if not text.strip():
                continue
            q_type = types[i] if i < len(types) else "text"
            question = Question.objects.create(
                survey=survey,
                text=text.strip(),
                question_type=q_type
            )

            if q_type in ["single", "multiple"]:
                for c in request.POST.getlist(f"choices_{i}[]"):
                    if c.strip():
                        Choice.objects.create(question=question, text=c.strip())

        return redirect("survey_list")

    return render(request, "survey/survey_create.html")


@login_required
def survey_summary(request, survey_id):
    survey = get_survey_or_404(request, survey_id)

    chart_data = []
    for question in survey.questions.all():
        entry = {"text": question.text, "type": question.question_type}

        if question.question_type in ["single", "multiple"]:
            labels, values = [], []
            for choice in question.choices.all():
                labels.append(choice.text)
                values.append(
                    Response.objects.filter(
                        question=question,
                        selected_choices=choice
                    ).count()
                )
            entry["labels"] = labels
            entry["data"] = values
        else:
            entry["answers"] = list(
                Response.objects.filter(question=question)
                .values_list("answer_text", flat=True)
            )

        chart_data.append(entry)

    context = {
        "survey": survey,
        "chart_data": json.dumps(chart_data, ensure_ascii=False),
        "respondents": Respondent.objects.filter(survey=survey),
        "qr_code": generate_qr_for_survey(request, survey),
    }

    return render(request, "survey/survey_summary.html", context)


# ===============================
# COLLECTE PUBLIQUE
# ===============================

def take_survey(request, survey_id):
    survey = get_public_survey_or_404(survey_id)
    questions = survey.questions.all()

    if request.method == "POST":
        interviewer_name = request.POST.get("interviewer_name", "").strip()
        if not interviewer_name:
            return render(request, "survey/take_survey.html", {
                "survey": survey,
                "questions": questions,
                "error": "Nom requis"
            })

        respondent = Respondent.objects.create(
            survey=survey,
            interviewer_name=interviewer_name
        )

        for question in questions:
            field = f"question_{question.id}"

            if question.question_type in ["single", "multiple"]:
                selected = request.POST.getlist(field)
                if selected:
                    response = Response.objects.create(
                        respondent=respondent,
                        question=question
                    )
                    for cid in selected:
                        try:
                            response.selected_choices.add(Choice.objects.get(id=int(cid)))
                        except:
                            pass
            else:
                answer = request.POST.get(field, "").strip()
                if answer:
                    Response.objects.create(
                        respondent=respondent,
                        question=question,
                        answer_text=answer
                    )

        return render(request, "survey/thanks.html", {"survey": survey})

    return render(request, "survey/take_survey.html", {
        "survey": survey,
        "questions": questions
    })


def survey_thanks(request, survey_id):
    survey = get_public_survey_or_404(survey_id)
    return render(request, "survey/thanks.html", {"survey": survey})
